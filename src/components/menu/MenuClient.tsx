"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import SplashScreen from "./SplashScreen";
import Design10 from "@/components/designs/Design10";
import type { MenuData } from "@/lib/menu";

const SPLASH_TIMEOUT = 4000;
const CONCURRENCY = 6;

function extractImageUrls(data: MenuData): string[] {
  const urls: string[] = [];
  const s = data.settings;
  if (s?.hero_image_url) urls.push(s.hero_image_url);
  if (s?.hero_logo_url) urls.push(s.hero_logo_url);
  if (s?.header_logo_url) urls.push(s.header_logo_url);

  for (const cat of data.categories) {
    for (const item of cat.items) {
      if (item.image_url) urls.push(item.image_url);
      for (const v of item.item_variants ?? []) {
        if (v.image_url) urls.push(v.image_url);
      }
      for (const img of item.item_images ?? []) {
        if (img.image_url) urls.push(img.image_url);
      }
    }
  }

  return [...new Set(urls)];
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

type Props = {
  data: MenuData;
  secureToken: string | null;
  tableResult: { valid: boolean; table_number: string | null } | null;
};

export default function MenuClient({ data, secureToken, tableResult }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [progress, setProgress] = useState(0);
  const keptImages = useRef<HTMLImageElement[]>([]);
  const logoUrl = data.settings?.hero_logo_url || undefined;

  const runPreload = useCallback(() => {
    const urls = extractImageUrls(data);
    if (urls.length === 0) {
      setProgress(100);
      return Promise.resolve();
    }

    return new Promise<void>((resolveAll) => {
      let cancelled = false;
      const total = urls.length;
      let loaded = 0;
      const queue = [...urls];

      const preloadOne = (url: string): Promise<void> =>
        new Promise((resolve) => {
          const img = new window.Image();
          keptImages.current.push(img);
          img.onload = () => {
            loaded++;
            if (!cancelled) setProgress(Math.round((loaded / total) * 100));
            resolve();
          };
          img.onerror = () => {
            loaded++;
            if (!cancelled) setProgress(Math.round((loaded / total) * 100));
            resolve();
          };
          img.src = url;
        });

      const worker = async () => {
        while (queue.length > 0 && !cancelled) {
          const url = queue.shift();
          if (!url) break;
          await preloadOne(url);
        }
      };

      const timeoutId = setTimeout(() => {
        cancelled = true;
        setDismissed(true);
      }, SPLASH_TIMEOUT);

      Promise.all(Array.from({ length: CONCURRENCY }, () => worker())).then(
        () => {
          if (cancelled) return;
          clearTimeout(timeoutId);
          setProgress(100);
          setTimeout(() => setDismissed(true), 300);
          resolveAll();
        },
      );
    });
  }, [data]);

  useEffect(() => {
    runPreload();
  }, [runPreload]);

  return (
    <>
      <Design10
        data={data}
        secureToken={secureToken}
        tableResult={tableResult}
      />
      <SplashScreen
        progress={progress}
        logoUrl={logoUrl}
        dismissed={dismissed}
      />
    </>
  );
}
