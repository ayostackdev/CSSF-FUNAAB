import { createClient as createServiceClient } from "@supabase/supabase-js";
import Header from "./component/Header";
import Footer from "./component/Footer";
import Hero from "./component/Hero";
import Groups from "./component/Groups";
import About from "./component/About";
import Verse from "./component/Verse";
import Service from "./component/Service";
import Contact from "./component/Contact";
import Sermon from "./component/Sermon";
import PledgeSection from "./component/PledgeSection";
import Loader from "./component/Loader";
import UpcomingEvent from "./component/UpcomingEvents";
import ChatWidget from "./component/ChatWidget";

export const revalidate = 300;

interface SermonItem {
  id: string;
  title: string;
  drive_link: string;
  created_at: string;
}

interface WorshipItem {
  id: string;
  title: string;
  image_url: string;
  order: number;
  created_at: string;
}

interface BannerItem {
  id: string;
  event_name: string;
  image_url: string;
  event_date?: string;
  event_time?: string;
  created_at: string;
}

function getStoragePathFromUrl(imageUrl: string, bucket: string): string {
  try {
    const parsed = new URL(imageUrl || "");
    const marker = `/${bucket}/`;
    const idx = parsed.pathname.indexOf(marker);
    if (idx !== -1) {
      return decodeURIComponent(parsed.pathname.slice(idx + marker.length));
    }
    const fallback = parsed.pathname.split("/").pop() || "";
    return decodeURIComponent(fallback);
  } catch {
    return (imageUrl || "").split("/").pop()?.split("?")[0] || "";
  }
}

export default async function Home() {
  const serviceUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!serviceUrl || !key) {
    throw new Error("Supabase is not configured");
  }

  const supabase = createServiceClient(serviceUrl, key);

  const { data: sermons } = await supabase
    .from("sermons")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .order("sort_order", { ascending: true });

  const { data: worship } = await supabase
    .from("worship_images")
    .select("*")
    .order("order", { ascending: true });

  const { data: banners } = await supabase
    .from("banners")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: anointedSounds } = await supabase
    .from("anointed_sounds")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const serverSermons = (sermons || []) as SermonItem[];
  const serverAnointedSounds = (anointedSounds || []) as Array<{ id: string; title: string; youtube_id: string }>;
  const serverGroups = (groups || []) as Array<{
    id: string;
    name: string;
    about: string;
    image: string;
    link?: string | null;
  }>;
  const serverWorship = (worship || []) as WorshipItem[];
  const serverEvents = (banners || []) as BannerItem[];

  let worshipWithUrls = serverWorship;
  let bannersWithUrls = serverEvents;

  if (serviceKey) {
    try {
      if (worshipWithUrls.length > 0) {
        worshipWithUrls = await Promise.all(
          worshipWithUrls.map(async (item) => {
            try {
              const fileName = getStoragePathFromUrl(item.image_url || "", "worship_images");
              if (!fileName) return item;

              const { data } = await supabase.storage
                .from("worship_images")
                .createSignedUrl(fileName, 60 * 60);

              return { ...item, image_url: data?.signedUrl || item.image_url };
            } catch {
              return item;
            }
          })
        );
      }

      if (bannersWithUrls.length > 0) {
        bannersWithUrls = await Promise.all(
          bannersWithUrls.map(async (item) => {
            try {
              const fileName = getStoragePathFromUrl(item.image_url || "", "event-banners");
              if (!fileName) return item;

              const { data } = await supabase.storage
                .from("event-banners")
                .createSignedUrl(fileName, 60 * 60);

              return { ...item, image_url: data?.signedUrl || item.image_url };
            } catch {
              return item;
            }
          })
        );
      }
    } catch {
      // ignore and fall back to stored URLs
    }
  }

  return (
    <>
      <Header />
      <Hero />
      <About />
      <Loader />
      <UpcomingEvent serverEvents={bannersWithUrls} />
      <Groups serverGroups={serverGroups} />
      <Sermon serverSermons={serverSermons} serverWorship={worshipWithUrls} serverAnointedSounds={serverAnointedSounds} />
      <Service />
      <Verse />
      <PledgeSection />
      <Contact />
      <Footer />
      <ChatWidget />
    </>
  );
}
