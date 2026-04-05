import styles from "./PageFooter.module.scss";

interface PageFooterProps {
  pageNumber: number;
}

export default function PageFooter({ pageNumber }: PageFooterProps) {
  return <div data-testid={`page-footer-${pageNumber}`} className={styles.footer}>{pageNumber}</div>;
}
