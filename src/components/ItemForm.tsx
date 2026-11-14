"use client";
import { useState } from "react";
import { useFormState } from "react-dom";
import { createItem, updateItem, type FormState } from "@/app/actions";
import { isEbayUrl, type Item, type Purchase } from "@/lib/items";
import { CONDITIONS, categoryOf } from "@/lib/categories";
import CategoryOptions from "./CategoryOptions";
import PhotoInput from "./PhotoInput";
import SubmitButton from "./SubmitButton";
import FormMessage from "./FormMessage";

type Props = { userId: string; item?: Item; purchase?: Purchase | null; defaultCategory?: string };

export default function ItemForm({ userId, item, purchase, defaultCategory }: Props) {
  const isNew = !item;
  const [state, action] = useFormState<FormState, FormData>(isNew ? createItem : updateItem, undefined);
  const [category, setCategory] = useState(item?.category ?? defaultCategory ?? "cards");
  const [forSale, setForSale] = useState(item?.for_sale ?? false);
  const [ebay, setEbay] = useState(item?.ebay_url ?? "");
  const ebayBad = forSale && ebay.trim() !== "" && !isEbayUrl(ebay);
  const [title, setTitle] = useState(item?.title ?? "");
  const cat = categoryOf(category);
  const attrs = item?.attributes ?? {};

  return (
    <form action={action} className="card">
      <div className="card-title"><h3>The item</h3></div>
      {item && <input type="hidden" name="id" value={item.id} />}
      <div className="grid2">
        <PhotoInput userId={userId} initial={item?.photo_path ?? null} title={title} />
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
        <div className="field full"><label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" maxLength={2000} defaultValue={item?.description ?? ""}
            placeholder="Anything worth knowing: edition, autographs, flaws, provenance, where you found it…" /></div>
      </div>

      <div className="card-title"><h3>Purchase</h3><span className="hint">Only you can see this</span></div>
      <div className="grid2">
        <div className="field"><label className="label" htmlFor="paid">Price paid ($)</label>
          <input id="paid" name="paid" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={purchase?.paid ?? ""} placeholder="0.00" /></div>
        <div className="field"><label className="label" htmlFor="purchased_at">Date bought</label>
          <input id="purchased_at" name="purchased_at" type="date" defaultValue={purchase?.purchased_at ?? ""} /></div>
        <div className="field"><label className="label" htmlFor="manual_value">Your value ($)</label>
          <input id="manual_value" name="manual_value" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={purchase?.manual_value ?? ""} placeholder="optional override" /></div>
        <div className="field"><label className="label" htmlFor="search_terms">Search words for sold listings</label>
          <input id="search_terms" name="search_terms" maxLength={200} defaultValue={item?.search_terms ?? ""} placeholder="Uses the name and details if blank" /></div>
      </div>

      <div className="field">
        <label className="check" htmlFor="is_hidden"><input id="is_hidden" name="is_hidden" type="checkbox" defaultChecked={item?.is_hidden ?? false} /> Hide this item from my public page</label>
        <span className="hint">Only you will see it, even when your collection is public. A hidden item also stays off the For sale page.</span>
      </div>

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
        {!forSale && item?.ebay_url && <input type="hidden" name="ebay_url" value={item.ebay_url} />}
      </div>

      <FormMessage state={state} />
      <div className="actions"><SubmitButton>{isNew ? "Add to my collection" : "Save changes"}</SubmitButton></div>
    </form>
  );
}
