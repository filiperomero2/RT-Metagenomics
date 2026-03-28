import { useState } from "react";

export function useModal() {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => setIsOpen(false);
  const handleOpen = () => setIsOpen(true);

  return {
    modal: {
      isOpen,
      onOpenChange: setIsOpen,
    },
    handleOpen,
    handleClose,
    setIsOpen,
  };
}
