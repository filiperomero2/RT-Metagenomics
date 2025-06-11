"use client";

import { BookText, ChartPie } from "lucide-react";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Home() {
  const links = [
    { href: "/meta", label: "Meta", icon: ChartPie },
    // { href: "/about", label: "About", icon: BookText },
  ];

  return (
    <div className="h-[calc(100vh-65px)] flex  items-center justify-center gap-8">
      {links.map((link) => (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          key={link.href}
        >
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col gap-2 justify-center items-center bg-content1 ring-primary ring-2 h-96 px-12 rounded-xl shadow-2xl text-6xl text-primary dark:text-content1-foreground"
          >
            <link.icon size={100} />
            <p>{link.label}</p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
