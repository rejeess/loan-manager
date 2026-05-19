const ratingClass: Record<number, string> = {
  5: "ratingExcellent",
  4: "ratingGood",
  3: "ratingAverage",
  2: "ratingRisky",
  1: "ratingDefaulter"
};

type RatingBadgeProps = {
  rating: number;
  label: string;
};

export function RatingBadge({ rating, label }: RatingBadgeProps) {
  return <span className={`ratingBadge ${ratingClass[rating]}`}>{label}</span>;
}
