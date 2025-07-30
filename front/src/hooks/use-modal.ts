import { useState } from "react";

export function useModal() {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => setIsOpen(false);
  const handleOpen = () => setIsOpen(true);
  return {
    modal: {
      isOpen,
      onClose: handleClose,
    },
    handleOpen,
    handleClose,
  };
}
