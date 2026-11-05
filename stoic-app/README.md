# Stoic Practices

A small phone app built from *Stoic Practices: Actionable Instructions from Marcus Aurelius and Epictetus*.

- **Today**: before noon it opens on the day's morning preparation. After noon it opens on the evening reflection. The other one is one tap away.
- **Morning / Evening**: one item per day. It changes at midnight and works through the whole list before repeating. Use "Show another" for more.
  - Morning items come from the *Morning* section.
  - Evening items come from *Perspective and mortality* and *Ongoing training*.
- **Problems**: pick what's happening, such as "Someone insults or criticizes you". You get the quick-reference line to tell yourself, then a practice, with more practices one tap away.
- **All**: every practice, grouped by the document's sections.

All the content is in `index.html`. Nothing is sent anywhere.

## Putting it on your phone

It's a static site (an installable web app), so any HTTPS host works. With GitHub Pages:

1. Repository **Settings → Pages**, source "Deploy from a branch", choose the branch and `/ (root)`.
2. Open `https://<user>.github.io/<repo>/stoic-app/` on the phone.
3. **iPhone:** Safari → Share → *Add to Home Screen*. **Android:** Chrome → ⋮ → *Install app*.

Once opened, it works offline. After editing `index.html`, bump `VERSION` in `sw.js` so phones pick up the change.
