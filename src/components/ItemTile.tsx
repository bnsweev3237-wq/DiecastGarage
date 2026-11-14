import Link from "next/link";
import { certLabel, money, photoUrl, type Item } from "@/lib/items";
import { categoryOf, summary } from "@/lib/categories";
import ItemPlaceholder from "./ItemPlaceholder";
import { Stars } from "./Stars";

type Props = { item: Item; owner?: { username: string } | null; value?: number | null };

export default function ItemTile({ item, owner, value }: Props) {
  const src = photoUrl(item.photo_path);
  const href = owner ? `/c/${owner.username}/${item.id}` : `/collection/${item.id}`;
  const line = summary(item);
  const cat = categoryOf(item.category);
  const cert = certLabel(item);
  const morePhotos = item.photos?.length ?? 0;
  const cls = ["tile", item.for_sale && "sale", item.featured && "featured", item.status !== "owned" && item.status].filter(Boolean).join(" ");
  return (
    <Link href={href} className={cls}>
      <span className="tile-media">
        {src ? <img className="img" src={src} alt="" loading="lazy" /> : <span className="img" title="No photo yet"><ItemPlaceholder /></span>}
        <span className="tag-cat">{cat.emoji} {cat.label}</span>
        {item.featured && <span className="tag-grail" title="Featured">★ Grail</span>}
        {item.status === "wishlist" && <span className="tag-status want">Wishlist</span>}
        {item.status === "sold" && <span className="tag-status sold">Sold</span>}
        {cert && <span className="tag-cert">{cert}</span>}
        {morePhotos > 0 && <span className="tag-count" title={`${morePhotos + 1} photos`}>📷 {morePhotos + 1}</span>}
        {item.for_sale && <span className="tag-sale">{item.asking_price != null ? money(Number(item.asking_price), 2) : "For sale"}</span>}
      </span>
      <div className="body">
        <div className="car-title">{item.title}{item.quantity > 1 && <span className="qty"> ×{item.quantity}</span>}</div>
        {line && <div className="specline">{line}</div>}
        {item.rating && <Stars value={item.rating} small />}
        {item.is_hidden && <div className="meta"><span className="chip box">Hidden</span></div>}
        {value != null && item.status === "owned" && <div className="by">Est. value <span className="num">{money(value, 2)}</span></div>}
        {owner && <div className="by">@{owner.username}</div>}
      </div>
    </Link>
  );
}
