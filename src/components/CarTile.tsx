import Link from "next/link";
import { money, photoUrl, type Car } from "@/lib/cars";

type Props = { car: Car; owner?: { username: string } | null; value?: number | null };

export default function CarTile({ car, owner, value }: Props) {
  const src = photoUrl(car.photo_path);
  const href = owner ? `/c/${owner.username}/${car.id}` : `/garage/${car.id}`;
  return (
    <Link href={href} className="tile">
      {src ? <img className="img" src={src} alt="" loading="lazy" /> : <span className="img">No photo</span>}
      <div className="body">
        <div className="car-title">{car.title}</div>
        <div className="meta">
          {car.is_hidden && <span className="chip box">Hidden</span>}
          {car.for_sale && <span className="chip sale">For sale</span>}
          {car.scale && <span className="chip scale">{car.scale}</span>}
          {car.brand && <span className="chip">{car.brand}</span>}
          <span className="chip box">{car.boxed ? "Boxed" : "No box"}</span>
        </div>
        {car.for_sale && car.asking_price != null && <div className="price num">{money(Number(car.asking_price), 2)}</div>}
        {value != null && <div className="by">Est. value <span className="num">{money(value, 2)}</span></div>}
        {owner && <div className="by">@{owner.username}</div>}
      </div>
    </Link>
  );
}
