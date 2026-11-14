"use client";
import { useState } from "react";
import { useFormState } from "react-dom";
import { createItem, updateItem, type FormState } from "@/app/actions";
import { COA_ISSUERS, GRADERS, STATUSES, allPhotos, isEbayUrl, type Item, type ItemStatus, type Purchase } from "@/lib/items";
import { CONDITIONS, categoryOf } from "@/lib/categories";
import CategoryOptions from "./CategoryOptions";
import PhotoInput from "./PhotoInput";
import { StarInput } from "./Stars";
import SubmitButton from "./SubmitButton";
import FormMessage from "./FormMessage";

type Props = { userId: string; item?: Item; purchase?: Purchase | null; defaultCategory?: string; defaultStatus?: string };

export default function ItemForm({ userId, item, purchase, defaultCategory, defaultStatus }: Props) {
  const isNew = !item;
  const [state, action] = useFormState<FormState, FormData>(isNew ? createItem : updateItem, undefined);
  const [category, setCategory] = useState(item?.category ?? defaultCategory ?? "cards");
  const [status, setStatus] = useState<ItemStatus>(item?.status ?? (STATUSES.some((s) => s.key === defaultStatus) ? (defaultStatus as ItemStatus) : "owned"));
  const [certified, setCertified] = useState(item?.is_certified ?? false);
  const [certType, setCertType] = useState(item?.cert_type ?? "graded");
  const [forSale, setForSale] = useState(item?.for_sale ?? false);
  const [ebay, setEbay] = useState(item?.ebay_url ?? "");
  const ebayBad = forSale && ebay.trim() !== "" && !isEbayUrl(ebay);
  const [title, setTitle] = useState(item?.title ?? "");
  const cat = categoryOf(category);
  const attrs = item?.attributes ?? {};
  const owned = status === "owned";

  return (
    <form action={action} className="card item-form">
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="card-title"><h3>Status</h3></div>
      <div className="seg" role="radiogroup" aria-label="Status">
        {STATUSES.map((s) => (
          <label key={s.key} className={status === s.key ? "on" : undefined}>
            <input type="radio" name="status" value={s.key} checked={status === s.key} onChange={() => setStatus(s.key)} />
            <b>{s.label}</b><span>{s.hint}</span>
          </label>
        ))}
      </div>

      <div className="card-title"><h3>The item</h3></div>
      <div className="grid2">
        <PhotoInput userId={userId} initial={item ? allPhotos(item) : []} title={title} />
        <div className="field full"><label className="label" htmlFor="category">Category</label>
          <select id="category" name="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <CategoryOptions />
          </select></div>
        <div className="field full"><label className="label" htmlFor="title">Name</label>
          <input id="title" name="title" required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="What is it? e.g. 1999 Pokémon Base Set Charizard" /></div>
        <div className="field"><label className="label" htmlFor="brand">{cat.brandLabel}</label>
          <input id="brand" name="brand" maxLength={60} defaultValue={item?.brand ?? ""} /></div>
        <div className="field"><label className="label" htmlFor="year">Year</label>
          <input id="year" name="year" maxLength={12} inputMode="numeric" defaultValue={item?.year ?? ""} placeholder="1999" /></div>

        {/* Category-specific details. The key on the wrapper resets these inputs when the category changes. */}
        <div className="grid2 span-all" key={category}>
          {cat.fields.map((f) => (
            <div className="field" key={f.key}>
              <label className="label" htmlFor={`a_${f.key}`}>{f.label}</label>
              <input id={`a_${f.key}`} name={`a_${f.key}`} maxLength={100} list={f.options ? `opts_${f.key}` : undefined}
                defaultValue={item?.category === category ? attrs[f.key] ?? "" : ""} placeholder={f.placeholder} />
              {f.options && <datalist id={`opts_${f.key}`}>{f.options.map((o) => <option key={o} value={o} />)}</datalist>}
            </div>
          ))}
        </div>

        <div className="field"><label className="label" htmlFor="condition">Condition</label>
          <select id="condition" name="condition" defaultValue={item?.condition ?? ""}>
            <option value="">Not set</option>
            {CONDITIONS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select></div>
        <div className="field" style={{ justifyContent: "flex-end" }}>
          <label className="check" htmlFor="in_package"><input id="in_package" name="in_package" type="checkbox" defaultChecked={item?.in_package ?? false} /> {cat.packagingLabel}</label></div>
        <div className="field"><label className="label" htmlFor="quantity">Quantity</label>
          <input id="quantity" name="quantity" type="number" min="1" max="9999" step="1" inputMode="numeric" defaultValue={item?.quantity ?? 1} /></div>
        <div className="field"><label className="label" htmlFor="edition">Edition or serial number</label>
          <input id="edition" name="edition" maxLength={60} defaultValue={item?.edition ?? ""} placeholder="#45 of 500, 1st edition" /></div>
      </div>

      <div className="certbox">
        <label className="check" htmlFor="is_certified">
          <input id="is_certified" name="is_certified" type="checkbox" checked={certified} onChange={(e) => setCertified(e.target.checked)} /> Graded or has a certificate of authenticity (COA)
        </label>
        {certified && (
          <div className="grid2">
            <div className="field full">
              <div className="seg small" role="radiogroup" aria-label="Graded or COA">
                <label className={certType === "graded" ? "on" : undefined}><input type="radio" name="cert_type" value="graded" checked={certType === "graded"} onChange={() => setCertType("graded")} /><b>Professionally graded</b></label>
                <label className={certType === "coa" ? "on" : undefined}><input type="radio" name="cert_type" value="coa" checked={certType === "coa"} onChange={() => setCertType("coa")} /><b>Certificate of authenticity</b></label>
              </div>
            </div>
            <div className="field"><label className="label" htmlFor="cert_by">{certType === "coa" ? "COA issued by" : "Graded by"}</label>
              <input id="cert_by" name="cert_by" maxLength={60} list={certType === "coa" ? "coa_issuers" : "graders"} defaultValue={item?.cert_by ?? ""}
                placeholder={certType === "coa" ? "PSA/DNA, JSA, Beckett" : "PSA, BGS, CGC, PCGS"} />
              <datalist id="graders">{GRADERS.map((g) => <option key={g} value={g} />)}</datalist>
              <datalist id="coa_issuers">{COA_ISSUERS.map((g) => <option key={g} value={g} />)}</datalist></div>
            {certType === "graded" && (
              <div className="field"><label className="label" htmlFor="cert_grade">Grade</label>
                <input id="cert_grade" name="cert_grade" maxLength={20} defaultValue={item?.cert_grade ?? ""} placeholder="10, 9.8, MS-65" /></div>
            )}
            <div className="field"><label className="label" htmlFor="cert_number">{certType === "coa" ? "COA or sticker number" : "Certification number"}</label>
              <input id="cert_number" name="cert_number" maxLength={60} defaultValue={item?.cert_number ?? ""} placeholder="12345678" />
              <span className="hint">Shown publicly so others can verify it. PSA, PCGS, NGC and CGC numbers get a lookup link.</span></div>
          </div>
        )}
      </div>

      <div className="grid2">
        <div className="field"><span className="label">My rating</span><StarInput initial={item?.rating ?? null} /></div>
        <div className="field" style={{ justifyContent: "flex-end" }}>
          <label className="check" htmlFor="featured"><input id="featured" name="featured" type="checkbox" defaultChecked={item?.featured ?? false} /> ★ Feature it: one of my grails</label>
          <span className="hint">Featured items show first on your page.</span></div>
        <div className="field full"><label className="label" htmlFor="tags">Tags</label>
          <input id="tags" name="tags" maxLength={400} defaultValue={item?.tags?.join(", ") ?? ""} placeholder="Earnhardt, PC, Trade bait" />
          <span className="hint">Your own labels, separated by commas. Up to 10.</span></div>
        <div className="field full"><label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" maxLength={2000} defaultValue={item?.description ?? ""}
            placeholder="Anything worth knowing: details, autographs, flaws, where you found it…" /></div>
        <div className="field full"><label className="label" htmlFor="provenance">Provenance and history</label>
          <textarea id="provenance" name="provenance" maxLength={2000} defaultValue={item?.provenance ?? ""}
            placeholder="Previous owners, where it came from, receipts or paperwork…" /></div>
      </div>

      <div className="card-title"><h3>{status === "wishlist" ? "Hunting for it" : "Purchase"}</h3><span className="hint">Only you can see this</span></div>
      <div className="grid2">
        {status !== "wishlist" && <>
          <div className="field"><label className="label" htmlFor="paid">Price paid ($)</label>
            <input id="paid" name="paid" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={purchase?.paid ?? ""} placeholder="0.00" /></div>
          <div className="field"><label className="label" htmlFor="purchased_at">Date bought</label>
            <input id="purchased_at" name="purchased_at" type="date" defaultValue={purchase?.purchased_at ?? ""} /></div>
          <div className="field"><label className="label" htmlFor="shipping">Shipping ($)</label>
            <input id="shipping" name="shipping" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={purchase?.shipping ?? ""} placeholder="0.00" />
            <span className="hint">Left out of gain or loss, since sold listing prices don&apos;t include shipping. Counted in profit when you sell.</span></div>
          <div className="field"><label className="label" htmlFor="tax">Tax ($)</label>
            <input id="tax" name="tax" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={purchase?.tax ?? ""} placeholder="0.00" /></div>
          <div className="field"><label className="label" htmlFor="fees">Fees ($)</label>
            <input id="fees" name="fees" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={purchase?.fees ?? ""} placeholder="grading, buyer's premium" /></div>
          <div className="field"><label className="label" htmlFor="acquired_from">Where I got it</label>
            <input id="acquired_from" name="acquired_from" maxLength={100} list="sources" defaultValue={purchase?.acquired_from ?? ""} placeholder="eBay, card show, trade" />
            <datalist id="sources">{["eBay", "Facebook Marketplace", "Card or toy show", "Local shop", "Auction house", "Garage or estate sale", "Trade", "Gift", "Inherited", "Pulled from a pack"].map((x) => <option key={x} value={x} />)}</datalist></div>
          <div className="field"><label className="label" htmlFor="storage_location">Where it&apos;s stored</label>
            <input id="storage_location" name="storage_location" maxLength={100} defaultValue={purchase?.storage_location ?? ""} placeholder="Binder 3, garage shelf B" /></div>
        </>}
        <div className="field"><label className="label" htmlFor="manual_value">{status === "wishlist" ? "Target price ($)" : "Your value ($)"}</label>
          <input id="manual_value" name="manual_value" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={purchase?.manual_value ?? ""} placeholder="optional override" /></div>
        <div className="field"><label className="label" htmlFor="search_terms">Search words for sold listings</label>
          <input id="search_terms" name="search_terms" maxLength={200} defaultValue={item?.search_terms ?? ""} placeholder="Uses the name and details if blank" /></div>
      </div>

      {status === "sold" && (
        <div className="grid2 soldbox">
          <div className="field"><label className="label" htmlFor="sold_price">Sold for ($)</label>
            <input id="sold_price" name="sold_price" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={purchase?.sold_price ?? ""} placeholder="0.00" /></div>
          <div className="field"><label className="label" htmlFor="sold_at">Date sold</label>
            <input id="sold_at" name="sold_at" type="date" defaultValue={purchase?.sold_at ?? ""} /></div>
          <p className="hint span-all">Only you see the sale price and your profit. Others just see that it sold.</p>
        </div>
      )}

      <div className="field">
        <label className="check" htmlFor="is_hidden"><input id="is_hidden" name="is_hidden" type="checkbox" defaultChecked={item?.is_hidden ?? false} /> Hide this item from my public page</label>
        <span className="hint">Only you will see it, even when your collection is public. A hidden item also stays off the For sale page.</span>
      </div>

      {owned && (
        <div className="forsale-box">
          <label className="check" htmlFor="for_sale"><input id="for_sale" name="for_sale" type="checkbox" checked={forSale}
            onChange={(e) => setForSale(e.target.checked)} /> Mark this item for sale</label>
          {forSale && (
            <div className="grid2">
              <div className="field full"><label className="label" htmlFor="ebay_url">eBay listing link (required)</label>
                <input id="ebay_url" name="ebay_url" type="url" required value={ebay} onChange={(e) => setEbay(e.target.value)}
                  placeholder="https://www.ebay.com/itm/…" aria-invalid={ebayBad} />
                <span className={ebayBad ? "hint down" : "hint"}>
                  {ebayBad ? "That doesn't look like an eBay link. Copy it from your listing's page." : "List it on eBay first, then paste the listing's link. Buyers check out on eBay."}
                </span></div>
              <div className="field"><label className="label" htmlFor="asking_price">Asking price ($)</label>
                <input id="asking_price" name="asking_price" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={item?.asking_price ?? ""} placeholder="shown on the listing" /></div>
            </div>
          )}
        </div>
      )}
      {(!owned || !forSale) && item?.ebay_url && <input type="hidden" name="ebay_url" value={item.ebay_url} />}

      <FormMessage state={state} />
      <div className="actions"><SubmitButton>{isNew ? (status === "wishlist" ? "Add to my wishlist" : "Add to my collection") : "Save changes"}</SubmitButton></div>
    </form>
  );
}
