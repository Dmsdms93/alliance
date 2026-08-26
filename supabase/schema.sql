-- ============================================================
--  Alliance — Schéma SQL Complet (Matchmaking + Messagerie)
--  À copier-coller dans le SQL Editor de Supabase
-- ============================================================
--
--  Tables créées :
--  1. profiles   — Profil utilisateur (lié à auth.users)
--  2. swipes     — Actions Passer / Matcher
--  3. matches    — Paires d'utilisateurs qui se sont likés mutuellement
--  4. messages   — Messages de chat entre matchs
--
--  Triggers :
--  - Création auto de profil à l'inscription
--  - Match automatique quand 2 users se likent mutuellement
--  - updated_at automatique sur profiles
--
--  Sécurité : RLS activée sur toutes les tables
--
--  ⚠️ Exécutez ce script EN ENTIER dans le SQL Editor.
-- ============================================================

-- ============================================================
--  1. TABLE : profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  age INTEGER CHECK (age IS NULL OR (age >= 18 AND age <= 99)),
  bio TEXT DEFAULT '',
  photo_url TEXT,
  gender TEXT CHECK (gender IS NULL OR gender IN ('homme', 'femme')),
  looking_for TEXT CHECK (looking_for IS NULL OR looking_for IN ('homme', 'femme', 'les deux')),
  phone TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_looking_for ON public.profiles(looking_for);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- ============================================================
--  2. TABLE : swipes
--  Enregistre chaque action : liker (true) ou passer (false)
--  Contrainte UNIQUE : un utilisateur ne peut swiper une même
--  personne qu'une seule fois.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  swiped_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_like BOOLEAN NOT NULL, -- true = Match (cœur), false = Passer (croix)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(swiper_id, swiped_id)
);

CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON public.swipes(swiper_id);
CREATE INDEX IF NOT EXISTS idx_swipes_swiped ON public.swipes(swiped_id);
CREATE INDEX IF NOT EXISTS idx_swipes_pair ON public.swipes(swiper_id, swiped_id);

-- ============================================================
--  3. TABLE : matches
--  Créé automatiquement par le trigger quand 2 users se likent
--  mutuellement. Les IDs sont ordonnés (user1 < user2) pour
--  garantir l'unicité de la paire.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK(user1_id <> user2_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_user1 ON public.matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON public.matches(user2_id);

-- ============================================================
--  4. TABLE : messages
--  Stocke les messages entre utilisateurs matchés.
--  La persistance sert d'historique — le temps réel est géré
--  par Supabase Realtime (postgres_changes).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_match ON public.messages(match_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(match_id, read_at) WHERE read_at IS NULL;

-- ============================================================
--  5. TRIGGER : Création auto de profil à l'inscription
--  Quand un user s'inscrit (INSERT dans auth.users), un profil
--  vide est créé avec onboarding_completed = false.
--  L'utilisateur est alors redirigé vers /onboarding.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, onboarding_completed)
  VALUES (NEW.id, FALSE)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
--  6. TRIGGER : updated_at automatique sur profiles
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
--  7. TRIGGER : MATCH AUTOMATIQUE
--  Écoute les insertions dans swipes.
--  Quand l'utilisateur A "like" l'utilisateur B (is_like = true),
--  le trigger vérifie si B a déjà "liké" A.
--  Si oui → insertion automatique dans matches.
--
--  Logique :
--  1. Si le swipe est un "pass" (is_like = false) → on ignore
--  2. Si le swipe est un "like" → on cherche un like réciproque
--  3. Si like réciproque trouvé → on crée le match (si pas déjà existant)
--  4. Les IDs sont ordonnés (user1 < user2) pour l'unicité
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_mutual_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reverse_like_exists BOOLEAN;
  match_exists BOOLEAN;
  user1 UUID;
  user2 UUID;
BEGIN
  -- Un match n'est possible que sur un like (pas un pass)
  IF NEW.is_like = FALSE THEN
    RETURN NEW;
  END IF;

  -- Vérifie si l'autre utilisateur a aussi liké (like réciproque)
  SELECT EXISTS(
    SELECT 1 FROM public.swipes
    WHERE swiper_id = NEW.swiped_id
      AND swiped_id = NEW.swiper_id
      AND is_like = TRUE
  ) INTO reverse_like_exists;

  IF reverse_like_exists THEN
    -- Ordonne les IDs pour garantir l'unicité (user1_id < user2_id)
    IF NEW.swiper_id < NEW.swiped_id THEN
      user1 := NEW.swiper_id;
      user2 := New.swiped_id;
    ELSE
      user1 := NEW.swiped_id;
      user2 := NEW.swiper_id;
    END IF;

    -- Vérifie qu'un match n'existe pas déjà pour cette paire
    SELECT EXISTS(
      SELECT 1 FROM public.matches
      WHERE user1_id = user1 AND user2_id = user2
    ) INTO match_exists;

    IF NOT match_exists THEN
      INSERT INTO public.matches (user1_id, user2_id)
      VALUES (user1, user2);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_swipe_inserted ON public.swipes;
CREATE TRIGGER on_swipe_inserted
  AFTER INSERT ON public.swipes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_mutual_like();

-- ============================================================
--  8. ROW LEVEL SECURITY (RLS)
--  Chaque utilisateur ne peut lire et écrire que ce qui
--  le concerne directement.
-- ============================================================

-- --- Activer RLS ---
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
--  8a. POLICIES : profiles
-- ============================================================

-- Lecture : son propre profil + les profils avec onboarding complété (pour le feed)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_select_completed" ON public.profiles;
CREATE POLICY "profiles_select_completed"
  ON public.profiles FOR SELECT
  USING (onboarding_completed = TRUE);

-- Modification : uniquement son propre profil
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
--  8b. POLICIES : swipes
-- ============================================================

-- Lecture : un user voit les swipes qu'il a faits et ceux reçus
DROP POLICY IF EXISTS "swipes_select_own" ON public.swipes;
CREATE POLICY "swipes_select_own"
  ON public.swipes FOR SELECT
  USING (auth.uid() = swiper_id OR auth.uid() = swiped_id);

-- Insertion : un user ne peut créer un swipe que s'il est le swiper
DROP POLICY IF EXISTS "swipes_insert_own" ON public.swipes;
CREATE POLICY "swipes_insert_own"
  ON public.swipes FOR INSERT
  WITH CHECK (auth.uid() = swiper_id);

-- Suppression : un user peut supprimer ses propres swipes
DROP POLICY IF EXISTS "swipes_delete_own" ON public.swipes;
CREATE POLICY "swipes_delete_own"
  ON public.swipes FOR DELETE
  USING (auth.uid() = swiper_id);

-- ============================================================
--  8c. POLICIES : matches
-- ============================================================

-- Lecture : un user voit uniquement ses matchs
DROP POLICY IF EXISTS "matches_select_own" ON public.matches;
CREATE POLICY "matches_select_own"
  ON public.matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Suppression : un user peut supprimer (unmatch) un de ses matchs
DROP POLICY IF EXISTS "matches_delete_own" ON public.matches;
CREATE POLICY "matches_delete_own"
  ON public.matches FOR DELETE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Note: l'insertion de matches est faite par le trigger (SECURITY DEFINER),
-- pas besoin de policy INSERT publique.

-- ============================================================
--  8d. POLICIES : messages
-- ============================================================

-- Lecture : un user voit les messages de ses matchs uniquement
DROP POLICY IF EXISTS "messages_select_own_matches" ON public.messages;
CREATE POLICY "messages_select_own_matches"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = messages.match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- Insertion : un user peut envoyer un message dans un match le concernant
DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
CREATE POLICY "messages_insert_own"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- Modification : un user peut marquer comme lu les messages reçus
DROP POLICY IF EXISTS "messages_update_read" ON public.messages;
CREATE POLICY "messages_update_read"
  ON public.messages FOR UPDATE
  USING (
    auth.uid() <> sender_id AND
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = messages.match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- ============================================================
--  9. ACTIVER SUPABASE REALTIME
--  Nécessaire pour que les messages arrivent en temps réel.
--  À exécuter aussi dans le SQL Editor.
-- ============================================================

-- Ajoute la table messages au publication realtime (Supabase)
-- Cette commande permet à Supabase Realtime de diffuser les changements
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Alternative si la publication n'existe pas encore :
-- CREATE PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============================================================
--  ✅ SCHÉMA TERMINÉ
--
--  Récapitulatif :
--  - 4 tables : profiles, swipes, matches, messages
--  - 3 triggers : auto-profil, updated_at, match automatique
--  - 12 policies RLS (sécurité par utilisateur)
--  - Realtime activé sur messages (chat temps réel)
-- ============================================================
