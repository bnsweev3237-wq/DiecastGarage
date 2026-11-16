import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Comments from "@/components/Comments";
import Gallery from "@/components/Gallery";
import RateItem from "@/components/RateItem";
import { Stars } from "@/components/Stars";
import ReportButton from "@/components/ReportButton";
import { getUser } from "@/lib/supabase/server";
import { allPhotos, certLookupUrl, money, type Item } from "@/lib/items";
import { categoryOf, conditionLabel } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function PublicItem({ params }: { params: { username: string; itemId: string } }) {
  const { supabase, user } = await getUser();
  const { data } = await supabase.from("items").select("*, owner:profiles(id, username)").eq("id", params.itemId).maybeSingle();
  const car = data as (Item & { owner: { id: string; username: string } }) | null;
  if (!car || car.owner.username !== params.username.toLowerCase()) notFound();
  const [{ data: values }, { data: owner }, { data: location }, { data: myRating }] = await Promise.all([
    supabase.rpc("item_values", { p_owner: car.owner_id }),
    supabase.from("profiles").select("show_values, show_location").eq("id", car.owner_id).single(),
    supabase.rpc("profile_location", { p_profile: car.owner_id }),
    user && user.id !== car.owner_id
      ? supabase.from("item_ratings").select("stars").eq("item_id", car.id).eq("rater_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const sellerLocation = typeof location === "string" && (user?.id !== car.owner_id || owner?.show_location) ? location : null;
  const value = (values as { item_id: string; value: number }[] | null)?.find((v) => v.item_id === car.id)?.value;
  // Owners always get their values back, so only show it when their setting says others see it too.
  const showValue = value != null && car.status === "owned" && (user?.id !== car.owner_id || owner?.show_values);
  const lookup = car.is_certified ? certLookupUrl(car.cert_by, car.cert_number) : null;
  const isOwner = user?.id === car.owner_id;
  const path = `/c/${car.owner.username}/${car.id}`;

  return (
    <main className="wrap">
      <div className="head">
        <div><Link href={`/c/${car.owner.username}`}>← @{car.owner.username}&apos;s collection</Link><h1>{car.title}</h1></div>
        {isOwner && <Link className="btn" href={`/collection/${car.id}`}>Edit item</Link>}
      </div>
      {car.is_hidden && <p className="notice">This item is hidden. Only you can see this page.</p>}
      {car.under_review && <p className="notice">This item is hidden from other collectors while our team reviews reports about it.</p>}
      <div className="carpage">
        <Gallery paths={allPhotos(car)} title={car.title} />
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
          {(car.featured || car.status !== "owned") && (
            <div className="item-flags">
              {car.featured && <span className="flag grail">★ Grail</span>}
              {car.status === "wishlist" && <span className="flag want">On the wishlist</span>}
              {car.status === "sold" && <span className="flag sold">Sold</span>}
            </div>
          )}
          <section className="rating-card">
            <div className="rating-score">
              {car.rating_count > 0 ? <>
                <b className="num">{Number(car.rating_avg).toFixed(1)}</b>
                <span><Stars value={Math.round(Number(car.rating_avg))} /><span className="hint">{car.rating_count} collector rating{car.rating_count === 1 ? "" : "s"}</span></span>
              </> : <span className="hint">No ratings from collectors yet{!isOwner ? ". Be the first!" : "."}</span>}
            </div>
            {!isOwner && (user
              ? <RateItem itemId={car.id} path={path} mine={(myRating as { stars: number } | null)?.stars ?? null} />
              : <p className="hint"><Link href={`/login?next=${encodeURIComponent(path)}`}>Sign in</Link> to rate this item.</p>)}
            {car.rating && <p className="hint">Owner&apos;s own rating: <Stars value={car.rating} small /></p>}
          </section>
          {car.is_certified && (
            <section className="cert-card">
              <span className="label">{car.cert_type === "coa" ? "Certificate of authenticity" : "Professionally graded"}</span>
              <div className="cert-main">
                {car.cert_type === "graded" && car.cert_grade && <b className="cert-grade">{car.cert_grade}</b>}
                <span>{car.cert_by ?? (car.cert_type === "coa" ? "COA" : "Graded")}{car.cert_number && <> · <span className="num">#{car.cert_number}</span></>}</span>
              </div>
              {lookup && <a className="btn small" href={lookup} target="_blank" rel="noopener noreferrer nofollow">Verify on {car.cert_by?.split(" ")[0]} ↗</a>}
            </section>
          )}
          <section className="card">
            <dl className="specs">
              <dt>Category</dt><dd>{categoryOf(car.category).emoji} {categoryOf(car.category).label}</dd>
              {car.brand && <><dt>{categoryOf(car.category).brandLabel}</dt><dd>{car.brand}</dd></>}
              {categoryOf(car.category).fields.filter((f) => car.attributes?.[f.key]).map((f) => (
                <Fragment key={f.key}><dt>{f.label}</dt><dd>{car.attributes![f.key]}</dd></Fragment>
              ))}
              {car.year && <><dt>Year</dt><dd>{car.year}</dd></>}
              {car.condition && <><dt>Condition</dt><dd>{conditionLabel(car.condition)}</dd></>}
              {car.in_package && <><dt>Packaging</dt><dd>{categoryOf(car.category).packagingLabel}</dd></>}
              {car.quantity > 1 && <><dt>Quantity</dt><dd className="num">{car.quantity}</dd></>}
              {car.edition && <><dt>Edition</dt><dd>{car.edition}</dd></>}
              {showValue && <><dt>Est. value</dt><dd className="num">{money(Number(value), 2)}</dd></>}
            </dl>
            {car.description && <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{car.description}</p>}
            {car.provenance && <div><span className="label">Provenance and history</span><p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{car.provenance}</p></div>}
            {car.tags?.length > 0 && (
              <div className="meta">{car.tags.map((t) => <Link key={t} className="chip tag" href={`/c/${car.owner.username}?tag=${encodeURIComponent(t)}`}>#{t}</Link>)}</div>
            )}
            {user && !isOwner && <div><ReportButton type="item" id={car.id} /></div>}
          </section>
        </div>
      </div>
      <Comments profileId={car.owner_id} itemId={car.id} path={path} />
    </main>
  );
}
