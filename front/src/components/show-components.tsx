import { cn } from "@/utils/cn";
import { AnimatePresence, motion } from "framer-motion";

type ShowComponentProps = {
  children: React.ReactNode;
  gridClassName?: string;
  gridInnerClassName?: string;
  show: boolean;
  initial?: boolean;
};

export function ShowComponent({
  children,
  show,
  gridClassName,
  gridInnerClassName,
  initial = false,
}: ShowComponentProps) {
  return (
    <AnimatePresence initial={initial}>
      {show && (
        <motion.div
          className={cn("grid", gridClassName)}
          initial={{ gridTemplateRows: "0fr" }}
          animate={{ gridTemplateRows: "1fr" }}
          exit={{ gridTemplateRows: "0fr" }}
        >
          <div className={cn("overflow-hidden", gridInnerClassName)}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
