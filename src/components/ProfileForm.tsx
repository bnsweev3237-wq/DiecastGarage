"use client";
import { useFormState } from "react-dom";
import { updateProfile, type FormState } from "@/app/actions";
import SubmitButton from "./SubmitButton";
import FormMessage from "./FormMessage";
import AvatarInput from "./AvatarInput";
import { NETWORKS, type SocialKey } from "@/lib/social";

type Props = {
  fullName: string | null;
  email: string;
  bio: string | null;
  isPublic: boolean;
  showEmail: boolean;
  showValues: boolean;
  location: string | null;
  showLocation: boolean;
  commentsFrom: string;
  showFollows: boolean;
  userId: string;
  username: string;
  avatarPath: string | null;
  links: Partial<Record<SocialKey, string | null>>;
};

export default function ProfileForm({ fullName, email, bio, isPublic, showEmail, showValues, location, showLocation, commentsFrom, showFollows, userId, username, avatarPath, links }: Props) {
  const [state, action] = useFormState<FormState, FormData>(updateProfile, undefined);
  return (
    <form action={action} className="card">
      <h3>Profile</h3>
      <AvatarInput userId={userId} initial={avatarPath} username={username} />
      <div className="field"><label className="label" htmlFor="full_name">Full name</label>
        <input id="full_name" name="full_name" maxLength={100} defaultValue={fullName ?? ""} autoComplete="name" />
        <span className="hint">Only you see this. Other collectors see your username.</span></div>
      <div className="field"><label className="label" htmlFor="location">Location</label>
        <input id="location" name="location" maxLength={60} defaultValue={location ?? ""} placeholder="City, State" autoComplete="address-level2" />
        <span className="hint">Private unless you choose to show it below. Handy for local trades and pickups.</span></div>
      <div className="field"><label className="label" htmlFor="bio">About you</label>
        <textarea id="bio" name="bio" maxLength={500} defaultValue={bio ?? ""} placeholder="What you collect, favorite drivers, years you're hunting…" />
        <span className="hint">Shown on your public page.</span></div>

      <h3>Links</h3>
      <p className="hint">Shown on your public page. Paste a link or just type your username.</p>
      <div className="grid2">
        {NETWORKS.map((n) => (
          <div className="field" key={n.key}><label className="label" htmlFor={n.key}>{n.label}</label>
            <input id={n.key} name={n.key} defaultValue={links[n.key] ?? ""} placeholder={n.example} maxLength={220} /></div>
        ))}
      </div>

      <h3>Privacy</h3>
      <label className="check" htmlFor="is_public"><input id="is_public" name="is_public" type="checkbox" defaultChecked={isPublic} /> Make my collection public</label>
      <p className="hint">Public: anyone can see your collection, follow you and comment. Private: only you can see your items, and your for-sale items stay off the For sale page.</p>
      <label className="check" htmlFor="show_email"><input id="show_email" name="show_email" type="checkbox" defaultChecked={showEmail} /> Show my email address ({email}) on my public page</label>
      <label className="check" htmlFor="show_location"><input id="show_location" name="show_location" type="checkbox" defaultChecked={showLocation} /> Show my location on my public page and for-sale items</label>
      <label className="check" htmlFor="show_follows"><input id="show_follows" name="show_follows" type="checkbox" defaultChecked={showFollows} /> Show who I follow and who follows me</label>
      <label className="check" htmlFor="show_values"><input id="show_values" name="show_values" type="checkbox" defaultChecked={showValues} /> Show my items&apos; estimated values</label>
      <p className="hint">These only apply while your collection is public. To hide a single item, open it in My collection and tick Hide.</p>
      <div className="field"><label className="label" htmlFor="comments_from">Who can comment on my collection</label>
        <select id="comments_from" name="comments_from" defaultValue={commentsFrom}>
          <option value="everyone">Everyone signed in</option>
          <option value="following">Only collectors I follow</option>
          <option value="nobody">Nobody (comments off)</option>
        </select>
        <span className="hint">Existing comments stay up. You can still delete any comment on your collection.</span></div>
      <div className="notice">
        <b>Always private, only ever shown to you:</b> your full name, what you paid, gain or loss, purchase dates, and the sold listings you log.
        Your email and location stay private too unless you tick the boxes above.
      </div>

      <FormMessage state={state} />
      <div className="actions"><SubmitButton>Save profile</SubmitButton></div>
    </form>
  );
}
