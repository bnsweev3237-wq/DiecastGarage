"use client";
import { useState } from "react";
import { useFormState } from "react-dom";
import { createCar, updateCar, type FormState } from "@/app/actions";
import { BRANDS, SCALES, isEbayUrl, type Car, type Purchase } from "@/lib/cars";
import PhotoInput from "./PhotoInput";
import SubmitButton from "./SubmitButton";
import FormMessage from "./FormMessage";

type Props = { userId: string; car?: Car; purchase?: Purchase | null };

export default function CarForm({ userId, car, purchase }: Props) {
  const isNew = !car;
  const [state, action] = useFormState<FormState, FormData>(isNew ? createCar : updateCar, undefined);
  const [forSale, setForSale] = useState(car?.for_sale ?? false);
  const [ebay, setEbay] = useState(car?.ebay_url ?? "");
  const ebayBad = forSale && ebay.trim() !== "" && !isEbayUrl(ebay);
  const [title, setTitle] = useState(car?.title ?? "");

  return (
    <form action={action} className="card">
      <div className="card-title"><h3>The car</h3></div>
      {car && <input type="hidden" name="id" value={car.id} />}
      <div className="grid2">
        <PhotoInput userId={userId} initial={car?.photo_path ?? null} title={title} />
        <div className="field full"><label className="label" htmlFor="title">Driver / car</label>
          <input id="title" name="title" required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Dale Earnhardt #3 GM Goodwrench 1998 Daytona Win" /></div>
        <div className="field"><label className="label" htmlFor="brand">Brand</label>
          <input id="brand" name="brand" list="brands" defaultValue={car?.brand ?? ""} placeholder="Action, Lionel Racing…" /></div>
        <div className="field"><label className="label" htmlFor="scale">Scale</label>
          <input id="scale" name="scale" list="scales" defaultValue={car?.scale ?? "1:24"} /></div>
        <div className="field"><label className="label" htmlFor="year">Year / season</label>
          <input id="year" name="year" inputMode="numeric" defaultValue={car?.year ?? ""} placeholder="1998" /></div>
        <div className="field" style={{ justifyContent: "flex-end" }}>
          <label className="check" htmlFor="boxed"><input id="boxed" name="boxed" type="checkbox" defaultChecked={car?.boxed ?? true} /> Has the original box</label></div>
        <div className="field full"><label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" maxLength={2000} defaultValue={car?.description ?? ""}
            placeholder="Paint scheme, chase / color chrome / autographed, production run (e.g. 1 of 2,508), box condition…" /></div>
      </div>

      <div className="card-title"><h3>Purchase</h3><span className="hint">Only you can see this</span></div>
      <div className="grid2">
        <div className="field"><label className="label" htmlFor="paid">Price paid ($)</label>
          <input id="paid" name="paid" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={purchase?.paid ?? ""} placeholder="0.00" /></div>
        <div className="field"><label className="label" htmlFor="purchased_at">Date bought</label>
          <input id="purchased_at" name="purchased_at" type="date" defaultValue={purchase?.purchased_at ?? ""} /></div>
        <div className="field"><label className="label" htmlFor="manual_value">Your value ($)</label>
          <input id="manual_value" name="manual_value" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={purchase?.manual_value ?? ""} placeholder="optional override" /></div>
        <div className="field"><label className="label" htmlFor="search_terms">Search words for comps</label>
          <input id="search_terms" name="search_terms" maxLength={200} defaultValue={car?.search_terms ?? ""} placeholder="name, brand and scale" /></div>
      </div>

      <div className="field">
        <label className="check" htmlFor="is_hidden"><input id="is_hidden" name="is_hidden" type="checkbox" defaultChecked={car?.is_hidden ?? false} /> Hide this car from my public page</label>
        <span className="hint">Only you will see it, even when your collection is public. A hidden car also stays off the For sale page.</span>
      </div>

      <div className="forsale-box">
        <label className="check" htmlFor="for_sale"><input id="for_sale" name="for_sale" type="checkbox" checked={forSale}
          onChange={(e) => setForSale(e.target.checked)} /> Mark this car for sale</label>
        {forSale && (
          <div className="grid2">
            <div className="field full"><label className="label" htmlFor="ebay_url">eBay listing link (required)</label>
              <input id="ebay_url" name="ebay_url" type="url" required value={ebay} onChange={(e) => setEbay(e.target.value)}
                placeholder="https://www.ebay.com/itm/…" aria-invalid={ebayBad} />
              <span className={ebayBad ? "hint down" : "hint"}>
                {ebayBad ? "That doesn't look like an eBay link. Copy it from your listing's page." : "List the car on eBay first, then paste the listing's link. Buyers check out on eBay."}
              </span></div>
            <div className="field"><label className="label" htmlFor="asking_price">Asking price ($)</label>
              <input id="asking_price" name="asking_price" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={car?.asking_price ?? ""} placeholder="shown on the listing" /></div>
          </div>
        )}
        {!forSale && car?.ebay_url && <input type="hidden" name="ebay_url" value={car.ebay_url} />}
      </div>

      <FormMessage state={state} />
      <div className="actions"><SubmitButton>{isNew ? "Add to garage" : "Save changes"}</SubmitButton></div>

      <datalist id="brands">{BRANDS.map((b) => <option key={b} value={b} />)}</datalist>
      <datalist id="scales">{SCALES.map((s) => <option key={s} value={s} />)}</datalist>
    </form>
  );
}
