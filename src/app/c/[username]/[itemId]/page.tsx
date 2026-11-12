import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Comments from "@/components/Comments";
import ItemPlaceholder from "@/components/ItemPlaceholder";
import ReportButton from "@/components/ReportButton";
import { getUser } from "@/lib/supabase/server";
import { money, photoUrl, type Item } from "@/lib/items";
import { categoryOf, conditionLabel } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function PublicItem({ params }: { params: { username: string; itemId: string } }) {
  const { supabase, user } = await getUser();
  const { data } = await supabase.from("items").select("*, owner:profiles(id, username)").eq("id", params.itemId).maybeSingle();
  const car = data as (Item & { owner: { id: string; username: string } }) | null;
  if (!car || car.owner.username !== params.username.toLowerCase()) notFound();
  const [{ data: values }, { data: owner }, { data: location }] = await Promise.all([
    supabase.rpc("item_values", { p_owner: car.owner_id }),
    supabase.from("profiles").select("show_values, show_location").eq("id", car.owner_id).single(),
    supabase.rpc("profile_location", { p_profile: car.owner_id }),
  ]);
  const sellerLocation = typeof location === "string" && (user?.id !== car.owner_id || owner?.show_location) ? location : null;
  const value = (values as { item_id: string; value: number }[] | null)?.find((v) => v.item_id === car.id)?.value;
  // Owners always get their values back, so only show it when their setting says others see it too.
  const showValue = value != null && (user?.id !== car.owner_id || owner?.show_values);
  const src = photoUrl(car.photo_path);
  const isOwner = user?.id === car.owner_id;
  const path = `/c/${car.owner.username}/${car.id}`;

  return (
    <main className="wrap">
      <div className="head">
        <div><Link href={`/c/${car.owner.username}`}>← @{car.owner.username}&apos;s collection</Link><h1>{car.title}</h1></div>
        {isOwner && <Link className="btn" href={`/collection/${car.id}`}>Edit item</Link>}
      </div>
      {car.is_hidden && <p className="notice">This item is hidden. Only you can see this page.</p>}
      <div className="carpage">
        {src ? <img className="photo" src={src} alt={`Photo of ${car.title}`} /> : <div className="photo" style={{ display: "grid", placeItems: "center", color: "var(--muted)" }} title="No photo yet"><ItemPlaceholder width={240} /></div>}
        <div className="side">
          {car.for_sale && car.ebay_url && (
            <section className="forsale-box">
              <span className="chip sale" style={{ alignSelf: "flex-start" }}>For sale</span>
              {car.asking_price != null && <div className="est"><div><span className="label">Asking</span><div className="v">{money(Number(car.asking_price), 2)}</div></div></div>}
              {sellerLocation && <p className="hint">Seller is in {sellerLocation}</p>}
              <a className="btn flag" href={car.ebay_url} target="_blank" rel="noopener noreferrer nofollow">View on eBay ↗</a>
              <p className="hint">Sales happen on eBay. Check the listing, seller feedback and shipping before you buy.</p>
            </section>
          )}
          <section className="card">
            <dl className="specs">
              <dt>Category</dt><dd>{categoryOf(car.category).label}</dd>
              {car.brand && <><dt>{categoryOf(car.category).brandLabel}</dt><dd>{car.brand}</dd></>}
              {categoryOf(car.category).fields.filter((f) => car.attributes?.[f.key]).map((f) => (
                <Fragment key={f.key}><dt>{f.label}</dt><dd>{car.attributes![f.key]}</dd></Fragment>
              ))}
              {car.year && <><dt>Year</dt><dd>{car.year}</dd></>}
              {car.condition && <><dt>Condition</dt><dd>{conditionLabel(car.condition)}</dd></>}
              {car.in_package && <><dt>Packaging</dt><dd>{categoryOf(car.category).packagingLabel}</dd></>}
              {showValue && <><dt>Est. value</dt><dd className="num">{money(Number(value), 2)}</dd></>}
            </dl>
            {car.description && <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{car.description}</p>}
            {user && !isOwner && <div><ReportButton type="item" id={car.id} /></div>}
          </section>
        </div>
      </div>
      <Comments profileId={car.owner_id} itemId={car.id} path={path} />
    </main>
  );
}
