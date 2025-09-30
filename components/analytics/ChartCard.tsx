// components/analytics/ChartCard.tsx
import { FC, ReactNode } from 'react';
import styles from './ChartCard.module.css';

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

const ChartCard: FC<ChartCardProps> = ({ title, children }) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};

export default ChartCard;