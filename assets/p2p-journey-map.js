/* Purpose 2 Profit — canonical journey map (single source of truth for the
   cross-realm Course Directory). Keep in sync with the templates/page.p2p-*.json
   block sets. Course URLs auto-derive to /pages/courses-<handle>; `gate` is the
   realm's anchor course handle (locks the rest of that realm until done);
   `after` on an item locks it until that handle is done. Checks are intentionally
   excluded — they live in the Bonuses panel and are never gated. */
window.P2P_MAP = [
  { n:1, name:'Open Water', url:'/pages/p2p-learning', gate:'welcome-aboard', courses:[
    { t:'Welcome Aboard', h:'welcome-aboard' },
    { t:'RAFT', h:'raft' },
    { t:'Finding Your Lane', h:'finding-your-lane' },
    { t:'Protecting What You Make', h:'protecting-what-you-make' },
    { t:'Storefront Essentials', h:'storefront-essentials' },
    { t:'Selling on Shopify', h:'selling-on-shopify', o:true, after:'storefront-essentials' },
    { t:'Selling on Etsy', h:'selling-on-etsy', o:true, after:'storefront-essentials' },
    { t:'Selling on Beacons', h:'selling-on-beacons', o:true, after:'storefront-essentials' },
    { t:'Selling on Stan', h:'selling-on-stan', o:true, after:'storefront-essentials' },
    { t:'Psychology Behind a Purchase', h:'psychology-behind-a-purchase' },
    { t:'Show Up Your Way', h:'show-up-your-way' }
  ]},
  { n:2, name:'Element Forest', url:'/pages/realm-2', gate:'grows', courses:[
    { t:'The GROWS Formula', h:'grows' },
    { t:'Digital Product Advantage', h:'digital-product-advantage' },
    { t:'Bringing Your Brand to Life', h:'bringing-your-brand-to-life' },
    { t:'Canva Essentials', h:'canva-essentials' },
    { t:'Canva for Your Products', h:'canva-for-your-products' },
    { t:'Design Without the Degree', h:'design-without-the-degree' },
    { t:'Editing Without the Overwhelm', h:'editing-without-the-overwhelm' },
    { t:'What Every Product Needs', h:'what-every-product-needs' },
    { t:'Coloring & Activity Pages', h:'coloring-activity-pages', o:true },
    { t:'Journals & Devotionals', h:'journals-devotionals', o:true },
    { t:'Motivational & Prayer Cards', h:'motivational-prayer-cards', o:true },
    { t:'Planners', h:'planners', o:true },
    { t:'Stickers', h:'stickers', o:true },
    { t:'Media Kits & Social Templates', h:'media-kits-social-templates', o:true },
    { t:'Cards & Invitations', h:'cards-invitations', o:true }
  ]},
  { n:3, name:'Desert Blooms', url:'/pages/realm-3', gate:'pod-foundations', courses:[
    { t:'POD Foundations', h:'pod-foundations' },
    { t:'What Every Product Needs', h:'what-pod-products-need' },
    { t:'Trademark Traps in POD', h:'trademark-traps-in-pod' },
    { t:'T-Shirts & Apparel', h:'t-shirts-apparel', o:true },
    { t:'Mugs & Drinkware', h:'mugs-drinkware', o:true },
    { t:'Home Decor & Wall Art', h:'home-decor-wall-art', o:true },
    { t:'OpenART for Designers', h:'openart-for-designers', o:true },
    { t:'Kittl for Designers', h:'kittl-for-designers', o:true }
  ]},
  { n:4, name:'Golden Harvest', url:'/pages/realm-4', gate:'turning-digital-to-physical', courses:[
    { t:'Turning Digital to Physical', h:'turning-digital-to-physical' },
    { t:'Publishing & Ebook Production', h:'publishing-ebook-production' },
    { t:'Amazon KDP & Audible', h:'amazon-kdp-audible' },
    { t:'Author Central & Book Marketing', h:'author-central-book-marketing' },
    { t:"What KDP Actually Won't Allow", h:'what-kdp-wont-allow' },
    { t:'Coloring & Activity Books', h:'coloring-activity-books', o:true },
    { t:'Music & Playlists', h:'music-playlists', o:true },
    { t:'Books to Audiobooks', h:'books-to-audiobooks', o:true },
    { t:'IngramSpark', h:'ingramspark', o:true },
    { t:"Children's Books on KDP", h:'childrens-books-kdp', o:true }
  ]},
  { n:5, name:'Evergreen', url:'/pages/realm-5', gate:'rooted', courses:[
    { t:'ROOTED', h:'rooted' },
    { t:'Pricing Your Products', h:'pricing-your-products' },
    { t:'Packaging to Sell', h:'packaging-to-sell' },
    { t:'Delivering to Your Buyer', h:'delivering-to-your-buyer' },
    { t:'Marketing Haus', h:'marketing-haus' },
    { t:'Making It Official', h:'making-it-official' },
    { t:'Building Your Email List', h:'building-your-email-list' },
    { t:'When Things Go Wrong', h:'when-things-go-wrong', o:true }
  ]}
];
