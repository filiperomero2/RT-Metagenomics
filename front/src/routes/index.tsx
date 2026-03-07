import { createFileRoute, Link } from "@tanstack/react-router";
import { ChartPie } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const links = [{ to: "/meta" as const, label: "Meta", icon: ChartPie }];

  return (
    <div className="text-primary flex h-[calc(100vh-65px)] items-center justify-center gap-8">
      {links.map((link) => (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          key={link.to}
        >
          <Link
            to={link.to}
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
