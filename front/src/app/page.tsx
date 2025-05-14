'use client'

import './globals.css';
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleMetaClick = () => {
    router.push("/meta"); // Navigate to the "Meta" page
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Welcome to RT-Metagenomics</h1>
      <div className={styles.tilesContainer}>
        <div className={styles.tile} onClick={handleMetaClick}>
          Meta
        </div>
        {/* <div className={styles.tile}>
          Consensus
        </div> */}
      </div>
    </div>
  );
}
