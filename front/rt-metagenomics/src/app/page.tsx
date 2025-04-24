import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Welcome to RT-Metagenomics</h1>
      <div className={styles.tilesContainer}>
        <div className={styles.tile}>
          Meta
        </div>
        <div className={styles.tile}>
          Consensus
        </div>
      </div>
    </div>
  );
}
