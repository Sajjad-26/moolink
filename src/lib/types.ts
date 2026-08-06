export type Profile = {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  theme: string;
  is_pro: boolean;
  created_at: string;
};

export type Link = {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  icon: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
};

export type ClickEvent = {
  id: string;
  link_id: string;
  profile_id: string;
  country: string | null;
  device_type: string | null;
  created_at: string;
};

export type LinkWithClicks = Link & {
  click_count: number;
};
