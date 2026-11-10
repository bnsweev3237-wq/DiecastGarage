import Link from "next/link";
import { money, photoUrl, type Car } from "@/lib/cars";
import CarOutline from "./CarOutline";

type Props = { car: Car; owner?: { username: string } | null; value?: number | null };

export default function CarTile({ car, owner, value }: Props) {
  const src = photoUrl(car.photo_path);
  const href = owner ? `/c/${owner.username}/${car.id}` : `/garage/${car.id}`;
  return (
    <Link href={href} className={car.for_sale ? "tile sale" : "tile"}>
      {src ? <img className="img" src={src} alt="" loading="lazy" /> : <span className="img" title="No photo yet"><CarOutline /></span>}
      <div className="body">
        <div className="specline">{[car.brand, car.scale, car.year, car.boxed ? "Boxed" : "No box"].filter(Boolean).join(" · ")}</div>
        <div className="car-title">{car.title}</div>
        {(car.is_hidden || car.for_sale) && (
          <div className="meta">
            {car.is_hidden && <span className="chip box">Hidden</span>}
            {car.for_sale && <span className="chip sale">For sale</span>}
          </div>
        )}
        {car.for_sale && car.asking_price != null && <div className="price num">{money(Number(car.asking_price), 2)}</div>}
        {value != null && <div className="by">Est. value <span className="num">{money(value, 2)}</span></div>}
        {owner && <div className="by">@{owner.username}</div>}
      </div>
    </Link>
  );
}
