"use client";

import { ChartPie } from "lucide-react";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Home() {
  const links = [{ href: "/meta", label: "Meta", icon: ChartPie }];

  return (
    <div className="flex h-[calc(100vh-65px)] items-center justify-center gap-8">
      {links.map((link) => (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          key={link.href}
        >
          <Link
            key={link.href}
            href={link.href}
            className="bg-content1 ring-primary text-primary dark:text-content1-foreground flex h-96 flex-col items-center justify-center gap-2 rounded-xl px-12 text-6xl shadow-2xl ring-2"
          >
            <link.icon size={100} />
            <p>{link.label}</p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
