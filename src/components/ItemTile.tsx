import Link from "next/link";
import { money, photoUrl, type Item } from "@/lib/items";
import { categoryOf, summary } from "@/lib/categories";
import ItemPlaceholder from "./ItemPlaceholder";

type Props = { item: Item; owner?: { username: string } | null; value?: number | null };

export default function ItemTile({ item, owner, value }: Props) {
  const src = photoUrl(item.photo_path);
  const href = owner ? `/c/${owner.username}/${item.id}` : `/collection/${item.id}`;
  const line = summary(item);
  return (
    <Link href={href} className={item.for_sale ? "tile sale" : "tile"}>
      {src ? <img className="img" src={src} alt="" loading="lazy" /> : <span className="img" title="No photo yet"><ItemPlaceholder /></span>}
      <div className="body">
        <span className="cat">{categoryOf(item.category).label}</span>
        <div className="car-title">{item.title}</div>
        {line && <div className="specline">{line}</div>}
        {(item.is_hidden || item.for_sale) && (
          <div className="meta">
            {item.is_hidden && <span className="chip box">Hidden</span>}
            {item.for_sale && <span className="chip sale">For sale</span>}
          </div>
        )}
        {item.for_sale && item.asking_price != null && <div className="price num">{money(Number(item.asking_price), 2)}</div>}
        {value != null && <div className="by">Est. value <span className="num">{money(value, 2)}</span></div>}
        {owner && <div className="by">@{owner.username}</div>}
      </div>
    </Link>
  );
}
