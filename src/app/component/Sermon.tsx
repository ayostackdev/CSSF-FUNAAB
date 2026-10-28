"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { getDriveStreamLink } from "../utils/formatDriveLink";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselIndicators,
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";

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

interface MediaItem {
  type: string;
  id?: string;
  link?: string;
  title: string;
}

interface SermonsMediaProps {
  serverSermons?: SermonItem[];
  serverWorship?: WorshipItem[];
  serverAnointedSounds?: Array<{ id: string; title: string; youtube_id: string }>;
}

export default function SermonsMedia({ serverSermons = [], serverWorship = [], serverAnointedSounds = [] }: SermonsMediaProps) {
  const tabs = ["Anointed Sounds", "Sermons", "Gallery"];
  const [activeTab, setActiveTab] = useState("Anointed Sounds");

  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));

  const anointedSounds = serverAnointedSounds.map((s) => ({
    type: "video" as const,
    id: s.youtube_id,
    title: s.title,
  }));

  const mediaData: Record<string, MediaItem[]> = {
    "Anointed Sounds": anointedSounds,
    Sermons: serverSermons.map((s) => ({
      type: "drive_embed",
      link: s.drive_link,
      title: s.title,
    })),
  };

  return (
    <section id="sermon" className="py-10 px-4 section-shell">
      <h2 className="section-title text-4xl text-center mb-12">
        Sermons &amp; Media
      </h2>

      <div className="flex justify-center gap-4 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              activeTab === tab
                ? "bg-blue-900 text-white shadow-lg scale-105"
                : "bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">
        {activeTab === "Gallery" ? (
          serverWorship.length > 0 ? (
            <Carousel
              plugins={[plugin.current]}
              onMouseEnter={plugin.current.stop}
              onMouseLeave={plugin.current.reset}
              className="w-full relative"
              opts={{ align: "center", loop: true }}
            >
              <CarouselContent>
                {serverWorship.map((item, idx) => (
                  <CarouselItem key={idx} index={idx} className="basis-full md:basis-1/2 lg:basis-1/3">
                    <Card className="border-none overflow-hidden shadow-xl rounded-2xl bg-white group">
                      <div className="relative aspect-square overflow-hidden">
                        <Image
                          src={item.image_url || ""}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop";
                          }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6">
                          <h3 className="text-white font-bold text-xl">{item.title}</h3>
                          <p className="text-blue-200 text-xs uppercase tracking-widest mt-1">Worship Image</p>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0 bg-white border-blue-600 text-blue-600" />
              <CarouselNext className="right-0 bg-white border-blue-600 text-blue-600" />
              <CarouselIndicators className="hidden md:flex" />
            </Carousel>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl shadow-inner border-2 border-dashed border-blue-200">
              <p className="text-xl font-semibold text-gray-400">The Gallery is currently empty</p>
            </div>
          )
        ) : (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {mediaData[activeTab]?.map((item, idx) => (
              <div key={idx} className="sermon-card-animated bg-white shadow-lg rounded-2xl overflow-hidden">
                {item.type === "video" && (
                  <div className="aspect-video">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${item.id}`}
                      title={item.title}
                      allowFullScreen
                      className="border-none"
                    />
                  </div>
                )}

                {item.type === "drive_embed" && (
                  <div className="relative w-full aspect-video bg-slate-900">
                    <iframe
                      src={getDriveStreamLink(item.link || "")}
                      width="100%"
                      height="100%"
                      allow="autoplay"
                      className="border-none"
                    />
                  </div>
                )}

                <div className="p-5">
                  <h3 className="font-bold text-lg text-blue-900 leading-tight">{item.title}</h3>
                  <span className="text-xs font-bold text-blue-400 uppercase mt-2 block tracking-wider">
                    {activeTab === "Sermons" ? "Message" : "Live Worship"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
