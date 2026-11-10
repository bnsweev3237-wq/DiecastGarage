import Link from "next/link";
import { notFound } from "next/navigation";
import Comments from "@/components/Comments";
import CarOutline from "@/components/CarOutline";
import ReportButton from "@/components/ReportButton";
import { getUser } from "@/lib/supabase/server";
import { money, photoUrl, type Car } from "@/lib/cars";

export const dynamic = "force-dynamic";

export default async function PublicCar({ params }: { params: { username: string; carId: string } }) {
  const { supabase, user } = await getUser();
  const { data } = await supabase.from("cars").select("*, owner:profiles(id, username)").eq("id", params.carId).maybeSingle();
  const car = data as (Car & { owner: { id: string; username: string } }) | null;
  if (!car || car.owner.username !== params.username.toLowerCase()) notFound();
  const [{ data: values }, { data: owner }, { data: location }] = await Promise.all([
    supabase.rpc("car_values", { p_owner: car.owner_id }),
    supabase.from("profiles").select("show_values, show_location").eq("id", car.owner_id).single(),
    supabase.rpc("profile_location", { p_profile: car.owner_id }),
  ]);
  const sellerLocation = typeof location === "string" && (user?.id !== car.owner_id || owner?.show_location) ? location : null;
  const value = (values as { car_id: string; value: number }[] | null)?.find((v) => v.car_id === car.id)?.value;
  // Owners always get their values back, so only show it when their setting says others see it too.
  const showValue = value != null && (user?.id !== car.owner_id || owner?.show_values);
  const src = photoUrl(car.photo_path);
  const isOwner = user?.id === car.owner_id;
  const path = `/c/${car.owner.username}/${car.id}`;

  return (
    <main className="wrap">
      <div className="head">
        <div><Link href={`/c/${car.owner.username}`}>← @{car.owner.username}&apos;s collection</Link><h1>{car.title}</h1></div>
        {isOwner && <Link className="btn" href={`/garage/${car.id}`}>Edit car</Link>}
      </div>
      {car.is_hidden && <p className="notice">This car is hidden. Only you can see this page.</p>}
      <div className="carpage">
        {src ? <img className="photo" src={src} alt={`Photo of ${car.title}`} /> : <div className="photo" style={{ display: "grid", placeItems: "center", color: "var(--muted)" }} title="No photo yet"><CarOutline width={240} /></div>}
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
              {car.brand && <><dt>Brand</dt><dd>{car.brand}</dd></>}
              {car.scale && <><dt>Scale</dt><dd className="num">{car.scale}</dd></>}
              {car.year && <><dt>Year</dt><dd>{car.year}</dd></>}
              <dt>Box</dt><dd>{car.boxed ? "Has the original box" : "No box (loose)"}</dd>
              {showValue && <><dt>Est. value</dt><dd className="num">{money(Number(value), 2)}</dd></>}
            </dl>
            {car.description && <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{car.description}</p>}
            {user && !isOwner && <div><ReportButton type="car" id={car.id} /></div>}
          </section>
        </div>
      </div>
      <Comments profileId={car.owner_id} carId={car.id} path={path} />
    </main>
  );
}
