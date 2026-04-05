import type { ReactNode } from "react";

import styles from "./TranslationPage.module.scss";

interface TranslationPageProps {
  children?: ReactNode;
}

export default function TranslationPage({ children = null }: TranslationPageProps) {
  return <div className={styles.container}>{children}</div>;
}
