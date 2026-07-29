/**
 * The AI Creator's Prompt Haus — Text Mode
 * Depends on prompt-builder-styledna.js and prompt-builder-engine.js.
 *
 * Meta-instruction assembler: a "Core Style" group that must stay
 * consistent across all 4 generated variations, and a "Variation Details"
 * group the AI is free to vary between them.
 *
 * Beyond the build plan's original schema, per the "don't just clone the
 * reference tool" call: a Text Case field (affects legibility/vibe) and a
 * grouped Text Effects field (glow/atmosphere/decorative finish — a much
 * bigger lever than a plain material texture), plus an opt-in Second
 * Phrase sub-panel that gives one word — or a fully separate second line/
 * phrase — its own distinct styling and position relative to the main
 * text.
 */
(function () {
  "use strict";

  window.PromptHaus = window.PromptHaus || {};
  var PromptHaus = window.PromptHaus;
  var makeField = PromptHaus.util.makeField;
  var sortAlpha = PromptHaus.util.sortAlpha;

  // ---------------------------------------------------------------------
  // Option lists — build plan Section 3 as the base, alphabetized, plus a
  // few new options per field so the catalog isn't a 1:1 clone. Text
  // Spacing is left in its tight -> wide progression (ordinal, not
  // categorical) rather than alphabetized, same reasoning as Character
  // Mode's Age Group/Height.
  // ---------------------------------------------------------------------
  // Full content rebuild from the owner's workbook — each option now
  // carries a full descriptive paragraph (LETTER_STYLE_PROMPTS below),
  // not just a short label. Dropdown still shows the short label;
  // assemblePrompt() swaps in the paragraph via
  // PromptHaus.engine.withPromptLookup. Full replacement of the prior
  // list — 34 items, exactly as the workbook's "New Prompt" column laid
  // them out.
  var LETTER_STYLE_OPTIONS = sortAlpha([
    "3d block",
    "acid wash tie-dye lettering",
    "airbrush 90s typography",
    "art deco lettering",
    "brush lettering script",
    "bubble / puffy",
    "burn book",
    "calligraphy",
    "chenille script patch",
    "chenille varsity patch",
    "coloring book",
    "cyberpunk",
    "dripping liquid letters",
    "editorial cutout",
    "gel / jelly",
    "graffiti streetwear typography",
    "grunge",
    "heavy metal punk",
    "kawaii cartoon typography",
    "liquid drip",
    "marker lettering",
    "memphis block",
    "neon glow",
    "newspaper headline",
    "outline / stroke",
    "pixel art",
    "puffy sticker letters",
    "ransom note",
    "retro 70s",
    "retro pixel",
    "shadow 3d",
    "sticker",
    "varsity block patch",
    "y2k chrome",
  ]);
  var LETTER_STYLE_PROMPTS = {
    "3d block": "Create bold three-dimensional block typography for a <product type>. Construct oversized geometric letterforms with strong architectural structure, substantial weight, and exaggerated depth that gives every character the appearance of solid sculpted forms. Each letter should feel individually illustrated with confident proportions, crisp edges, balanced spacing, and powerful dimensional perspective rather than generated from a standard font. Apply realistic lighting, rich shadow planes, polished highlights, and layered depth that creates impressive visual impact while maintaining exceptional readability. The finished typography should feel bold, premium, commanding, and professionally crafted.",
    "acid wash tie-dye lettering": "Create bold acid-wash tie-dye typography for a <product type>. Design oversized custom letterforms with thick, expressive construction and a distinctly retro apparel aesthetic. Every character should feel individually illustrated with organic variation, uneven pigment patterns, and handcrafted visual personality rather than generated from a standard font. Build the lettering with bleached marbling, cloudy dye transitions, mottled color breaks, washed fabric effects, and naturally irregular edges that resemble authentic acid-washed textile printing. Add subtle dimensional shading, defined outlines, and rich surface detail while preserving excellent readability. The typography should feel rebellious, nostalgic, energetic, and unmistakably inspired by vintage acid-wash and tie-dye fashion.",
    "airbrush 90s typography": "Create authentic 1990s airbrush typography for a <product type>. Design oversized custom letterforms inspired by classic carnival shirts, boardwalk art, and vintage airbrushed apparel using soft rounded construction, flowing curves, and expressive hand-painted personality. Every character should feel individually illustrated with smooth blended transitions, playful proportions, and handcrafted artistic detail rather than generated from a traditional font. Incorporate soft dimensional shading, polished highlights, bold outlines, and premium airbrushed depth that captures the unmistakable nostalgia of vintage custom artwork. The typography should feel vibrant, nostalgic, playful, and unmistakably 90s.",
    "art deco lettering": "Create elegant Art Deco typography for a <product type>. Design sophisticated custom letterforms inspired by 1920s and 1930s decorative design using tall geometric proportions, precise symmetry, stepped forms, sharp angles, and refined ornamental details. Every character should feel individually illustrated with architectural structure, graceful spacing, and premium craftsmanship rather than generated from a standard typeface. Incorporate streamlined linework, layered borders, polished dimensional depth, crisp highlights, and luxurious decorative accents that emphasize the glamorous period aesthetic. The typography should feel opulent, stylish, balanced, and instantly recognizable as premium Art Deco lettering.",
    "brush lettering script": "Create expressive brush-lettering script for a <product type>. Design flowing custom typography inspired by hand-painted sign work and modern brush calligraphy, using confident sweeping strokes, natural thick-to-thin transitions, fluid connections, and energetic handwritten movement. Every character should feel individually painted with visible stroke direction, organic variation, and authentic handcrafted personality rather than generated from a digital script font. Blend graceful curves, extended swashes, polished dimensional shading, subtle highlights, and rich painted depth while maintaining clear readability. The typography should feel bold, artistic, spontaneous, and professionally hand lettered.",
    "bubble / puffy": "Create bold, oversized bubble typography for a <product type>. Capture the unmistakable spirit of authentic 1990s hip-hop and urban street culture using thick, heavily inflated bubble letterforms with exaggerated rounded shapes, soft puffy curves, and playful oversized proportions. Every character should feel individually hand illustrated with expressive personality rather than generated from a standard typeface. Incorporate smooth flowing contours, confident bold outlines, and naturally varied spacing that creates energetic visual rhythm while maintaining exceptional readability. Finish the lettering with a luxurious glossy surface, rich dimensional shading, bright reflective highlights, and a polished inflated appearance that creates depth and visual impact. The typography should feel nostalgic, vibrant, playful, and instantly recognizable as premium 90s-inspired streetwear lettering.",
    "burn book": "Create playful burn book typography for a <product type>. Design expressive handwritten lettering inspired by iconic early-2000s scrapbook aesthetics using bold marker-style construction, playful irregular proportions, doodle-inspired details, and carefree personality. Every character should feel individually hand illustrated with authentic handwritten energy, natural imperfections, and creative artistic charm rather than generated from a digital font. Blend glossy dimensional shading, layered illustration, polished highlights, and premium handcrafted detail that captures the fun, dramatic personality of a decorated journal page. The typography should feel bold, cheeky, nostalgic, and full of personality.",
    "calligraphy": "Create elegant calligraphy typography for a <product type>. Design graceful hand-lettered script with flowing strokes, refined curves, and beautifully balanced flourishes inspired by traditional calligraphic artistry. Every character should feel individually hand illustrated with natural pen movement, expressive line variation, and sophisticated craftsmanship rather than generated from a digital script font. Blend smooth transitions, graceful connections, polished dimensional depth, subtle highlights, and premium finishing that enhances the luxurious handwritten appearance. The typography should feel timeless, artistic, refined, and effortlessly elegant.",
    "chenille script patch": "Create elegant chenille script typography for a <product type>. Design flowing handwritten script inspired by premium embroidered chenille patches using graceful curves, connected lettering, and expressive handcrafted movement. Every character should feel individually illustrated with authentic stitched construction, soft raised texture, and artisan craftsmanship rather than generated from a digital script font. Blend dimensional embroidery, layered fabric depth, polished highlights, and premium chenille detailing that enhances the luxurious textile appearance. The typography should feel sophisticated, nostalgic, warm, and beautifully handcrafted.",
    "chenille varsity patch": "Create chenille varsity typography for a <product type>. Design oversized collegiate-inspired letterforms that resemble premium embroidered chenille patches with bold athletic construction, rounded edges, and authentic stitched craftsmanship. Every character should feel individually hand illustrated with soft raised texture, natural fabric depth, and handcrafted personality rather than generated from a standard font. Blend dimensional embroidery, layered stitching, subtle highlights, rich depth, and premium textile detailing that creates the appearance of authentic varsity patches. The typography should feel nostalgic, premium, athletic, and beautifully crafted.",
    "coloring book": "Create coloring book typography for a <product type>. Design oversized custom letterforms using clean illustrated outlines, playful rounded construction, expressive hand-drawn curves, and bold coloring-friendly shapes. Every character should feel individually hand illustrated with charming artistic personality, natural line variation, and handcrafted detail rather than generated from a digital typeface. Incorporate crisp outlines, subtle dimensional depth, premium illustration quality, and clean interior spaces that invite creativity while maintaining excellent readability. The typography should feel cheerful, approachable, playful, and professionally illustrated.",
    "cyberpunk": "Create futuristic cyberpunk typography for a <product type>. Design bold custom letterforms inspired by advanced digital technology with sharp modern construction, dynamic futuristic proportions, and expressive sci-fi styling. Every character should feel individually illustrated with unique personality rather than generated from a conventional font. Incorporate layered dimensional depth, luminous edge lighting, sleek polished surfaces, crisp highlights, and premium futuristic detailing that creates impressive visual impact. The typography should feel powerful, immersive, high-tech, and instantly recognizable as premium cyberpunk-inspired lettering.",
    "dripping liquid letters": "Create dramatic liquid typography for a <product type>. Design oversized custom letterforms that appear formed from thick flowing liquid with exaggerated rounded shapes, smooth organic curves, and expressive dripping details. Every character should feel individually hand illustrated with fluid movement and natural irregularities rather than built from a traditional typeface. Blend soft inflated forms with flowing drips, dimensional depth, glossy reflections, and rich shading that create the illusion of fresh liquid in motion. The finished lettering should feel playful, bold, eye-catching, and highly dimensional while remaining clean and easy to read.",
    "editorial cutout": "Create editorial cutout typography for a <product type>. Design sophisticated custom lettering inspired by premium magazine layouts using bold mixed typography, layered paper elements, clean geometric composition, and expressive editorial styling. Every character should feel individually illustrated with handcrafted precision, natural variation, and artistic collage construction rather than generated from a standard font. Incorporate layered paper depth, crisp edges, subtle shadows, polished highlights, and premium illustration quality that creates the appearance of professionally assembled editorial artwork. The typography should feel modern, artistic, stylish, and visually distinctive.",
    "gel / jelly": "Create glossy gel typography for a <product type>. Design oversized custom letterforms with soft inflated construction, rounded contours, and smooth flowing shapes inspired by translucent gel and jelly materials. Every character should feel individually illustrated with expressive personality and handcrafted detail rather than generated from a digital typeface. Apply luxurious translucent depth, polished reflections, dimensional shading, rich highlights, and soft rounded volume that creates the appearance of thick glossy gel. The typography should feel playful, premium, modern, and irresistibly smooth.",
    "graffiti streetwear typography": "Create bold graffiti-inspired typography for a <product type>. Capture the energy of authentic urban street art with expressive hand-drawn lettering featuring exaggerated proportions, dynamic angles, oversized forms, and confident visual rhythm. Every letter should feel custom illustrated with natural imperfections, playful asymmetry, and the unmistakable personality of hand-crafted graffiti rather than a digital font. Incorporate thick outlines, layered dimensional depth, and flowing connections that create movement across the composition while remaining clean and highly legible. Finish with a premium glossy painted appearance, rich shading, crisp highlights, and vibrant streetwear attitude that feels modern, artistic, and unmistakably urban.",
    "grunge": "Create bold grunge typography for a <product type>. Design oversized custom letterforms with rugged construction, distressed edges, rough organic shapes, and expressive hand-crafted personality inspired by underground alternative street culture. Every character should feel individually illustrated with natural imperfections, uneven visual rhythm, and authentic artistic character rather than generated from a clean digital typeface. Blend weathered textures with bold outlines, dimensional shading, layered depth, and premium illustration quality while preserving excellent readability. The typography should feel rebellious, raw, energetic, and visually striking with unmistakable grunge attitude.",
    "heavy metal punk": "Create aggressive heavy metal typography for a <product type>. Design bold custom letterforms inspired by classic metal album artwork using sharp angular construction, jagged edges, exaggerated spikes, and powerful visual energy. Every character should feel individually hand illustrated with expressive distortion, natural asymmetry, and rebellious personality rather than generated from a conventional typeface. Incorporate dramatic dimensional depth, bold outlines, rich shading, crisp highlights, and premium illustrated detail while maintaining strong readability. The typography should feel loud, fearless, powerful, and unmistakably metal.",
    "kawaii cartoon typography": "Create adorable kawaii typography for a <product type>. Design oversized custom letterforms with soft rounded construction, playful proportions, expressive curves, and irresistibly cute personality inspired by Japanese pop culture. Every character should feel individually hand illustrated with cheerful movement, natural charm, and handcrafted artistic detail rather than generated from a standard typeface. Blend glossy dimensional shading, polished highlights, bold outlines, and premium illustration quality that enhances the lovable appearance. The typography should feel joyful, whimsical, colorful, and instantly heartwarming.",
    "liquid drip": "Create luxurious liquid typography for a <product type>. Construct oversized custom letterforms that appear sculpted from thick flowing material with exaggerated curves, rounded forms, and smooth organic movement. Every character should feel individually hand illustrated with expressive personality and fluid construction rather than produced from a digital typeface. Blend elegant flowing drips with polished dimensional shading, glossy reflections, and rich highlights that create convincing depth and volume. The typography should feel playful, premium, vibrant, and visually captivating while maintaining excellent readability.",
    "marker lettering": "Create bold marker-style typography for a <product type>. Design expressive custom hand-lettering inspired by thick paint markers and street art using confident strokes, rounded edges, natural line variation, and energetic handwritten movement. Every character should feel individually hand illustrated with authentic marker flow, playful imperfections, and artistic personality rather than generated from a standard font. Blend bold outlines, dimensional shading, polished highlights, and premium illustrated depth while preserving the spontaneous character of hand-drawn lettering. The typography should feel expressive, creative, energetic, and unmistakably handcrafted.",
    "memphis block": "Create Memphis-inspired typography for a <product type>. Design bold custom letterforms influenced by iconic 1980s Memphis design using playful geometric construction, exaggerated proportions, expressive asymmetry, and energetic visual rhythm. Every character should feel individually illustrated with artistic personality, handcrafted variation, and premium custom design rather than generated from a traditional font. Blend dimensional shading, polished highlights, bold outlines, and graphic detailing that captures the unmistakable spirit of classic Memphis design. The typography should feel vibrant, nostalgic, artistic, and full of playful energy.",
    "neon glow": "Create vibrant neon typography for a <product type>. Design custom illustrated letterforms inspired by illuminated neon signage using bold rounded construction, smooth flowing curves, and expressive hand-crafted character. Every letter should appear individually shaped with confident proportions and natural visual rhythm rather than generated from a traditional font. Apply brilliant glowing illumination, soft atmospheric lighting, rich dimensional shading, luminous highlights, and realistic neon depth that creates striking visual impact. The typography should feel energetic, playful, modern, and impossible to ignore.",
    "newspaper headline": "Create vintage newspaper headline typography for a <product type>. Design bold editorial letterforms inspired by classic newspaper mastheads using strong serif construction, timeless proportions, confident weight, and authentic print-era character. Every character should feel individually illustrated with handcrafted refinement, natural visual rhythm, and premium editorial craftsmanship rather than generated from a standard typeface. Blend subtle dimensional depth, crisp linework, polished highlights, and premium illustration quality while preserving the authentic vintage newspaper aesthetic. The typography should feel classic, authoritative, nostalgic, and instantly recognizable.",
    "outline / stroke": "Create bold outline typography for a <product type>. Design expressive custom letterforms with confident construction, clean proportions, and strong visual impact created through thick illustrated outlines and carefully balanced interior spacing. Every character should feel individually hand illustrated with playful rhythm, natural variation, and custom craftsmanship rather than generated from a standard font. Blend dimensional shading, subtle depth, crisp highlights, and premium illustration quality while allowing the bold outlines to remain the dominant visual feature. The typography should feel striking, modern, energetic, and instantly recognizable.",
    "pixel art": "Create authentic pixel-art typography for a <product type>. Construct custom letterforms entirely from crisp square pixels with blocky proportions, stepped edges, and unmistakable 8-bit and 16-bit video-game character. Every letter should feel individually illustrated with deliberate pixel placement, consistent grid logic, and handcrafted retro detail rather than rendered from a smooth modern font. Incorporate pixel-based highlights, layered block shading, sharp contrast, and dimensional sprite-like depth while avoiding anti-aliasing, soft edges, or blurred transitions. The typography should feel nostalgic, playful, iconic, and faithful to classic arcade and console graphics.",
    "puffy sticker letters": "Create puffy sticker typography for a <product type>. Design oversized custom letterforms with thick inflated construction, soft rounded edges, playful proportions, and expressive personality inspired by raised vinyl stickers. Every character should feel individually hand illustrated with custom craftsmanship and natural artistic variation rather than generated from a digital font. Blend luxurious glossy finishes, dimensional shading, polished highlights, bold outlines, and premium raised depth that creates the appearance of soft inflated sticker lettering. The typography should feel collectible, playful, nostalgic, and visually satisfying.",
    "ransom note": "Create ransom note typography for a <product type>. Design custom lettering assembled from intentionally mismatched characters inspired by hand-cut magazine and newspaper clippings, with varied proportions, playful inconsistencies, and expressive visual rhythm. Every character should feel individually illustrated with handcrafted personality, natural irregularities, and authentic collage-inspired construction rather than generated from a traditional typeface. Blend layered dimensional depth, crisp outlines, subtle shading, and premium illustration quality while preserving the intentionally imperfect appearance. The typography should feel bold, quirky, nostalgic, and visually captivating.",
    "retro 70s": "Create groovy retro typography for a <product type> inspired by authentic 1970s graphic design. Design oversized flowing letterforms featuring exaggerated rounded curves, playful proportions, and smooth organic movement that captures the unmistakable spirit of vintage seventies lettering. Every character should feel individually hand illustrated with expressive personality and custom craftsmanship rather than generated from a standard font. Incorporate bold flowing contours, confident visual rhythm, dimensional shading, polished highlights, and premium illustrated depth that creates nostalgic visual impact. The typography should feel warm, fun, timeless, and unmistakably retro.",
    "retro pixel": "Create pixel art typography for a <product type>. Design custom letterforms constructed entirely from crisp pixel blocks with authentic retro gaming proportions, clean geometric structure, and expressive nostalgic personality. Every character should feel individually illustrated with handcrafted pixel precision rather than generated from a standard digital font. Incorporate layered pixel shading, clean highlights, dimensional block depth, and premium retro illustration quality while preserving exceptional readability. The typography should feel playful, iconic, nostalgic, and instantly recognizable as classic pixel-art lettering.",
    "shadow 3d": "Create dimensional shadow typography for a <product type>. Design oversized custom letterforms featuring bold construction, clean proportions, and dramatic three-dimensional depth created through exaggerated cast shadows and layered perspective. Every character should feel individually illustrated with premium craftsmanship and custom-built structure rather than generated from a standard font. Blend rich lighting, polished highlights, bold outlines, and dynamic shadow work that produces striking depth and visual impact. The typography should feel bold, modern, professional, and highly dimensional.",
    "sticker": "Create bold sticker-style typography for a <product type>. Design playful custom letterforms with oversized proportions, rounded construction, expressive personality, and clean illustrated edges that resemble premium die-cut stickers. Every character should feel individually hand illustrated with lively movement, confident outlines, and custom craftsmanship rather than generated from a traditional font. Incorporate polished dimensional shading, glossy highlights, bold contour lines, and premium illustrated depth that enhances the authentic sticker appearance. The typography should feel fun, vibrant, collectible, and visually irresistible.",
    "varsity block patch": "Create classic varsity typography for a <product type>. Design bold collegiate-inspired block letterforms with clean geometric construction, confident proportions, and timeless athletic character. Every character should feel individually illustrated with premium craftsmanship, balanced spacing, and custom detailing rather than generated from a traditional athletic font. Incorporate dimensional depth, polished highlights, subtle shading, bold outlines, and premium illustration quality that enhances the authentic collegiate appearance. The typography should feel strong, confident, timeless, and instantly recognizable as classic varsity lettering.",
    "y2k chrome": "Create futuristic Y2K chrome typography for a <product type>. Design oversized custom letterforms inspired by iconic early-2000s digital aesthetics using bold rounded construction, sleek modern proportions, and expressive futuristic styling. Every character should feel individually illustrated with smooth metallic surfaces rather than generated from a standard font. Incorporate highly reflective chrome finishes, luminous highlights, rich mirrored reflections, and dimensional metallic depth that produces a polished premium appearance. The typography should feel nostalgic, futuristic, luxurious, and instantly recognizable as classic Y2K-inspired lettering.",
  };

  // Grouped like Character Type/Text Effects — curated category order
  // (not alphabetized), so related colors browse together.
  var COLOR_SCHEME_GROUPS = [
    {
      label: "Solid & Simple",
      options: [
        "black",
        "blue",
        "brown",
        "cream neutral",
        "desert clay",
        "forest",
        "gray",
        "green",
        "ice blue",
        "lime green",
        "mint",
        "ocean",
        "orange",
        "pastel",
        "pink",
        "purple",
        "red",
        "red / fire",
        "soft beige",
        "sunset",
        "tan",
        "teal",
        "white",
        "yellow",
      ],
    },
    {
      label: "Metallic & Luxury",
      options: [
        "black opal",
        "champagne gold",
        "copper / bronze",
        "dusty plum to rose gold",
        "emerald jewel",
        "gold",
        "grayscale monochrome",
        "opal",
        "sapphire blue",
        "silver / chrome",
      ],
    },
    {
      label: "Multicolor & Vibrant",
      options: [
        "candy bright multicolor",
        "electric neon mix",
        "neon mix",
        "pastel multicolor",
        "rainbow",
        "tropical vibrant",
        "vibrant multicolor",
      ],
    },
    {
      label: "Gradients",
      options: [
        "aqua dream to pink punch gradient",
        "blush pink to electric fuchsia gradient",
        "bold gradient blend",
        "cotton candy to cosmic violet gradient",
        "cyan to purple gradient",
        "forest to mint gradient",
        "gold to rose gold gradient",
        "lavender to hot pink gradient",
        "light teal blue to blush pink gradient",
        "neon yellow to seafoam gradient",
        "ocean gradient",
        "pastel gradient",
        "peach to coral gradient",
        "pink to purple gradient",
        "royal violet to midnight indigo gradient",
        "seafoam to bubblegum gradient",
        "strawberry to cream gradient",
        "sunset gradient",
        "teal to lime green gradient",
      ],
    },
    {
      label: "Holographic & Iridescent",
      options: [
        "holographic black opal",
        "holographic chrome rainbow",
        "holographic liquid prism",
        "holographic opal dream",
        "holographic rainbow shift",
      ],
    },
  ];
  var COLOR_SCHEME_PROMPTS = {
    "black": "Use sleek pure black and dark tones for the color scheme.",
    "blue": "Use rich blue tones with complementary navy and sky-blue variations throughout the design.",
    "brown": "Use rich brown earth tones with warm chocolate, caramel, and espresso variations throughout the design.",
    "cream neutral": "Use soft cream and neutral ivory tones with warm understated variations throughout the design.",
    "desert clay": "Use earthy desert clay tones featuring warm terracotta, sandstone, and sunbaked earth variations throughout the design.",
    "forest": "Use deep forest greens for the color scheme.",
    "gray": "Use refined gray tones with balanced charcoal, slate, and silver variations throughout the design.",
    "green": "Use vibrant green tones with complementary emerald and fresh botanical variations throughout the design.",
    "ice blue": "Use ice blue for the color scheme.",
    "lime green": "Use bright lime and neon green for the color scheme.",
    "mint": "Use fresh mint and aqua green for the color scheme.",
    "ocean": "Use cool ocean blues and teals for the color scheme.",
    "orange": "Use orange and warm tones for the color scheme.",
    "pastel": "Use a soft pastel color palette featuring gentle muted tones with smooth harmonious color transitions throughout the design.",
    "pink": "Use monochrome pink for the color scheme.",
    "purple": "Use luxurious purple tones with complementary violet and lavender variations throughout the design.",
    "red": "Use bold crimson and rich red tones with complementary tonal variations throughout the design.",
    "red / fire": "Use vibrant red and crimson flames for the color scheme.",
    "soft beige": "Use elegant soft beige tones with warm sand and natural neutral variations throughout the design.",
    "sunset": "Use warm sunset orange and purple blend for the color scheme.",
    "tan": "Use warm tan and sandstone tones with soft natural earth-tone variations throughout the design.",
    "teal": "Use rich teal tones with complementary aqua and turquoise variations throughout the design.",
    "white": "Use a crisp white color palette with subtle tonal variations and clean luminous highlights throughout the design.",
    "yellow": "Use vibrant golden yellow tones with warm complementary variations throughout the design.",
    "black opal": "Use dramatic black opal tones featuring dark iridescent color shifts with rich jewel-like spectral variations throughout the design.",
    "champagne gold": "Use luxurious champagne gold metallic tones with elegant warm reflective variations throughout the design.",
    "copper / bronze": "Use warm copper and bronze metallics for the color scheme.",
    "dusty plum to rose gold": "Use a smooth gradient transition from dusty plum to rose gold with seamless color blending throughout the design.",
    "emerald jewel": "Use rich emerald jewel tones with luxurious gemstone-inspired green variations throughout the design.",
    "gold": "Use luxurious metallic gold tones with rich reflective variations and premium golden highlights throughout the design.",
    "grayscale monochrome": "Use a monochromatic grayscale palette featuring rich blacks, brilliant whites, and balanced gray tonal transitions throughout the design.",
    "opal": "Use luminous opalescent tones featuring soft iridescent color shifts and pearlescent variations throughout the design.",
    "sapphire blue": "Use deep sapphire blue jewel tones with luxurious gemstone-inspired color variation throughout the design.",
    "silver / chrome": "Use polished silver and chrome metallic tones with brilliant reflective variation and premium mirrored highlights throughout the design.",
    "candy bright multicolor": "Use candy bright multicolor with saturated playful tones for the color scheme.",
    "electric neon mix": "Use electric neon mix of bright pinks, blues, and yellows for the color scheme.",
    "neon mix": "Use an energetic neon color palette featuring vivid electric hues with bold luminous color harmony throughout the design.",
    "pastel multicolor": "Use a soft pastel multicolor palette featuring harmonious muted hues with gentle balanced color transitions throughout the design.",
    "rainbow": "Use a vibrant rainbow color palette featuring bold saturated hues with balanced multicolor harmony throughout the design.",
    "tropical vibrant": "Use tropical vibrant with bright magentas, oranges and teals for the color scheme.",
    "vibrant multicolor": "Use vibrant multicolor explosion with bold bright hues for the color scheme.",
    "aqua dream to pink punch gradient": "Use a smooth gradient transition from aqua dream to pink punch gradient with seamless color blending throughout the design.",
    "blush pink to electric fuchsia gradient": "Use a smooth gradient transition from blush pink to electric fucshia with seamless color blending throughout the design.",
    "bold gradient blend": "Use a bold gradient color palette featuring striking color transitions with vibrant seamless blending throughout the design.",
    "cotton candy to cosmic violet gradient": "Use a smooth gradient transition from cotton candy to cosmic violet with seamless color blending throughout the design.",
    "cyan to purple gradient": "Use a smooth gradient transition from cyan to purple with seamless color blending throughout the design.",
    "forest to mint gradient": "Use a smooth gradient transition from forest to mint with seamless color blending throughout the design.",
    "gold to rose gold gradient": "Use a smooth gradient transition from gold to rose gold with seamless color blending throughout the design.",
    "lavender to hot pink gradient": "Use a smooth gradient transition from lavender to hot pink with seamless color blending throughout the design.",
    "light teal blue to blush pink gradient": "Use a smooth gradient transition from light teal blue to blush pink with seamless color blending throughout the design.",
    "neon yellow to seafoam gradient": "Use a smooth gradient transition from neon yellow to seafom with seamless color blending throughout the design.",
    "ocean gradient": "Use a smooth ocean gradient transition with seamless color blending throughout the design.",
    "pastel gradient": "Use a soft pastel gradient featuring gentle blended hues with smooth seamless color transitions throughout the design.",
    "peach to coral gradient": "Use a smooth gradient transition from peach to coral with seamless color blending throughout the design.",
    "pink to purple gradient": "Use a smooth gradient transition from pink to purple with seamless color blending throughout the design.",
    "royal violet to midnight indigo gradient": "Use a smooth gradient transition from royal violet to midnight indigo with seamless color blending throughout the design.",
    "seafoam to bubblegum gradient": "Use a smooth gradient transition from seafoam to bubblegum with seamless color blending throughout the design.",
    "strawberry to cream gradient": "Use a smooth gradient transition from strawberry to cream with seamless color blending throughout the design.",
    "sunset gradient": "Use a smooth sunset gradient transition with seamless color blending throughout the design.",
    "teal to lime green gradient": "Use a smooth gradient transition from teal to lime green with seamless color blending throughout the design.",
    "holographic black opal": "Use a holographic black opal color palette featuring iridescent color shifting and luminous spectral transitions throughout the design.",
    "holographic chrome rainbow": "Use a holographic chrome rainbow color palette featuring iridescent color shifting and luminous spectral transitions throughout the design.",
    "holographic liquid prism": "Use a holographic liquid prism color palette featuring iridescent color shifting and luminous spectral transitions throughout the design.",
    "holographic opal dream": "Use a holographic opal dream color palette featuring iridescent color shifting and luminous spectral transitions throughout the design.",
    "holographic rainbow shift": "Use a holographic rainbow shift color palette featuring iridescent color shifting and luminous spectral transitions throughout the design.",
  };

  // New field — case affects both legibility and vibe (e.g. "grunge" reads
  // very differently in lowercase vs. all-caps), and the reference tool
  // never lets the shopper control it at all.
  var TEXT_CASE_OPTIONS = sortAlpha([
    "uppercase", "lowercase", "title case", "sentence case", "mixed case (random)",
  ]);

  // New field — a broader, more dramatic effect layered over the whole
  // word (glow, atmosphere, decorative finish), distinct from Add-Ons
  // below (border/shadow accents). Grouped like Character Type/Holiday —
  // browses better by category than as one 35+-item flat wall.
  var TEXT_EFFECTS_GROUPS = [
    {
      label: "Material / Surface",
      options: [
        "brushed metal",
        "ceramic crackle glaze",
        "chrome",
        "concrete",
        "crochet texture",
        "denim",
        "embroidered thread",
        "fur texture",
        "glass effect",
        "glossy vinyl",
        "high gloss",
        "leather",
        "marble texture",
        "matte rubber",
        "metallic foil",
        "mosaic tile",
        "quilted",
        "satin finish",
        "stone carving",
        "super matte",
        "velvet texture",
        "wood finish",
      ],
    },
    {
      label: "Glow / Light",
      options: [
        "aura glow",
        "backlit sign",
        "ember glow",
        "flame glow",
        "neon glow",
      ],
    },
    {
      label: "Cool / Soft Atmosphere",
      options: [
        "cloud soft",
        "frosted glow",
        "ice crystal",
        "ice lettering",
        "mist effect",
      ],
    },
    {
      label: "Luxury / Decorative",
      options: [
        "diamond",
        "glitter",
        "gold leaf foil",
        "pearl finish",
        "rhinestone",
      ],
    },
    {
      label: "Fluid / Playful",
      options: [
        "candy coated",
        "gummy candy",
        "jelly texture",
        "liquid ripple",
        "marshmallow puff",
      ],
    },
    {
      label: "Digital / Effects",
      options: [
        "3d extruded",
        "chrome gradient warm",
        "glitch texture",
        "holographic",
        "holographic shift",
        "pixel distortion",
      ],
    },
    {
      label: "Distressed & Artistic",
      options: [
        "chalk finish",
        "cracked paint",
        "distressed grunge",
        "ink bleed",
        "spray paint",
        "watercolor",
      ],
    },
  ];
  var TEXT_EFFECTS_PROMPTS = {
    "brushed metal": "Apply a premium brushed metal finish to the lettering featuring fine directional grain, subtle linear texture, soft metallic reflections, precision-machined surfaces, and refined industrial craftsmanship throughout every letter. The lettering should feel modern, sophisticated, durable, and expertly fabricated from premium brushed metal.",
    "ceramic crackle glaze": "Apply a premium ceramic crackle glaze finish to the lettering featuring smooth glazed surfaces, delicate crackle patterns, subtle handcrafted imperfections, glossy fired ceramic reflections, and rich artisan depth throughout every letter. The lettering should feel elegant, handcrafted, timeless, and beautifully finished with authentic pottery craftsmanship.",
    "chrome": "Apply a premium polished chrome finish to the lettering featuring mirror-like reflective surfaces, brilliant metallic highlights, rich environmental reflections, smooth curved reflections, and luxurious dimensional depth. Every letter should feel bold, futuristic, and expertly crafted from polished chrome.",
    "concrete": "Apply a realistic concrete finish to the lettering featuring natural cement texture, subtle aggregate detail, weathered industrial surfaces, fine material variation, and substantial structural depth throughout every letter. The lettering should appear solid, architectural, durable, and expertly cast from premium concrete.",
    "crochet texture": "Apply an authentic crochet finish to the lettering featuring handwoven yarn loops, intricate stitched patterns, soft textile depth, visible handcrafted construction, and premium fiber detailing throughout every letter. The lettering should feel warm, cozy, handmade, and beautifully artisan crafted.",
    "denim": "Apply an authentic denim finish to the lettering featuring realistic woven cotton fibers, natural fabric texture, subtle stitch detailing, soft material depth, and premium textile realism. Every letter should appear handcrafted from durable denim with authentic apparel-inspired character.",
    "embroidered thread": "Apply an authentic embroidered thread finish to the lettering featuring densely stitched fibers, layered thread direction, raised embroidery texture, subtle fabric depth, and premium handcrafted detailing throughout every letter. The lettering should feel professionally embroidered with realistic textile craftsmanship and dimensional stitched depth.",
    "fur texture": "Apply a realistic fur finish to the lettering featuring dense layered fibers, soft natural strands, subtle directional movement, rich tactile depth, and luxurious plush realism throughout every letter. The lettering should feel warm, playful, cozy, and expertly crafted from premium faux fur.",
    "glass effect": "Apply a crystal-clear glass finish to the lettering featuring transparent depth, smooth polished surfaces, realistic internal reflections, crisp edge highlights, and premium refractive detail. Every letter should appear sculpted from flawless glass with exceptional clarity and dimensional realism.",
    "glossy vinyl": "Apply a premium glossy vinyl finish to the lettering featuring smooth flexible surfaces, rich reflective highlights, soft rounded edges, polished material depth, and the appearance of professionally manufactured vinyl graphics. Every letter should feel clean, bold, durable, and visually striking.",
    "high gloss": "Apply a luxurious high-gloss finish to the lettering featuring brilliant reflective highlights, smooth polished surfaces, rich dimensional depth, and premium light reflections that create the appearance of a professionally clear-coated finish. Every letter should feel sleek, vibrant, highly reflective, and flawlessly polished with exceptional depth and visual impact.",
    "leather": "Apply a premium leather finish to the lettering featuring realistic natural grain, soft pebbled texture, subtle stitched detailing, rich material depth, and luxurious handcrafted craftsmanship. Every letter should feel sophisticated, durable, and expertly crafted from genuine leather.",
    "marble texture": "Apply an elegant polished marble finish featuring realistic natural stone veining, subtle mineral variation, smooth carved surfaces, rich dimensional depth, and refined polished highlights throughout the lettering. Every letter should feel luxurious, timeless, and expertly sculpted from premium marble.",
    "matte rubber": "Apply a premium matte rubber finish to the lettering featuring smooth flexible surfaces, soft tactile texture, subtle light diffusion, rounded contours, and durable molded material realism. Every letter should feel modern, soft-touch, substantial, and professionally manufactured.",
    "metallic foil": "Apply a premium metallic foil finish to the lettering with brilliant reflective surfaces, crisp metallic highlights, smooth polished edges, and luxurious mirror-like shimmer that captures light from every angle. Every letter should feel elegant, high-end, and professionally foil stamped.",
    "mosaic tile": "Apply an intricate mosaic tile finish to the lettering featuring individually placed decorative tiles, realistic grout lines, handcrafted stone variation, polished ceramic surfaces, and rich dimensional detail throughout every letter. The lettering should appear meticulously assembled by skilled artisans with timeless decorative craftsmanship.",
    "quilted": "Apply a premium quilted finish to the lettering featuring soft padded construction, stitched panel sections, subtle fabric loft, dimensional cushioning, and elegant textile detailing throughout every letter. The lettering should feel plush, luxurious, and expertly crafted with realistic quilted depth.",
    "satin finish": "Apply a luxurious satin finish to the lettering featuring silky smooth surfaces, elegant soft reflections, refined fabric sheen, gentle light diffusion, and premium woven depth throughout every letter. The lettering should feel graceful, sophisticated, luxurious, and beautifully refined.",
    "stone carving": "Apply a hand-carved stone finish to the lettering featuring authentic chiseled surfaces, natural mineral texture, carved edge definition, weathered stone detail, and realistic sculptural depth throughout every letter. The lettering should appear expertly carved from solid natural stone with timeless craftsmanship and impressive dimensional realism.",
    "super matte": "Apply an ultra-smooth super matte finish to the lettering with soft non-reflective surfaces, rich color depth, subtle light diffusion, and a premium velvety appearance that absorbs light rather than reflecting it. Every letter should feel modern, refined, sophisticated, and professionally finished with a luxurious tactile quality.",
    "velvet texture": "Apply a luxurious velvet finish to the lettering featuring rich plush fibers, soft directional texture, subtle light absorption, and premium fabric depth that creates the appearance of high-end velvet upholstery. Every letter should feel soft, elegant, tactile, and visually luxurious.",
    "wood finish": "Apply a premium carved wood finish to the lettering featuring realistic natural wood grain, organic growth rings, subtle carved edges, rich timber texture, and handcrafted woodworking detail throughout every letter. The lettering should appear expertly carved from solid hardwood with warm natural character and timeless craftsmanship.",
    "aura glow": "Apply a soft aura glow surrounding the lettering with luminous edge lighting, gentle atmospheric diffusion, radiant energy, subtle light bloom, and smooth glowing gradients that extend naturally beyond every letter. The lettering should feel magical, vibrant, energetic, and surrounded by an elegant illuminated presence.",
    "backlit sign": "Apply a premium backlit sign effect to the lettering featuring soft illuminated halos, realistic edge lighting, subtle wall glow, internal light diffusion, and dimensional depth that recreates professionally fabricated illuminated signage. Every letter should feel modern, clean, sophisticated, and brilliantly lit from within.",
    "ember glow": "Apply a glowing ember finish to the lettering featuring deep heated surfaces, glowing orange cracks, smoldering edges, radiant internal warmth, subtle ash detailing, and rich fiery illumination that creates the appearance of slowly burning embers. Every letter should feel intensely warm, dramatic, and naturally forged by fire.",
    "flame glow": "Apply a dramatic flame glow effect to the lettering featuring realistic dancing flames, radiant orange and yellow illumination, glowing edges, intense internal heat, and layered fire-like movement that wraps naturally around every letter. The lettering should appear engulfed in controlled flames with bold energy, vivid luminosity, and striking visual impact.",
    "neon glow": "Apply a vibrant neon glow effect to the lettering featuring brilliant illuminated edges, luminous internal lighting, soft atmospheric glow, vivid light diffusion, and realistic neon tube illumination surrounding every letter. The lettering should feel energetic, electric, and impossible to ignore.",
    "cloud soft": "Apply an ultra-soft cloud-inspired finish to the lettering featuring fluffy rounded surfaces, pillowy volume, soft atmospheric shading, gentle light diffusion, and airy dimensional depth that creates the appearance of floating clouds. Every letter should feel soft, dreamy, comforting, and weightlessly light.",
    "frosted glow": "Apply a frosted illuminated finish to the lettering featuring icy crystalline surfaces, soft frozen diffusion, shimmering frost particles, cool luminous highlights, and subtle glowing reflections throughout every letter. The lettering should feel crisp, refreshing, elegant, and beautifully frozen.",
    "ice crystal": "Apply an intricate ice crystal finish to the lettering featuring faceted frozen surfaces, sharp crystalline formations, sparkling frost growth, brilliant light refraction, and detailed frozen textures throughout every letter. The lettering should appear carved from naturally formed crystal ice with exceptional clarity and dazzling frozen brilliance.",
    "ice lettering": "Apply a realistic frozen ice finish to the lettering featuring translucent icy surfaces, smooth frozen depth, subtle internal frost, polished frozen reflections, and naturally chilled dimensional realism. Every letter should appear sculpted from solid crystal-clear ice with exceptional frozen detail and brilliant cold reflections.",
    "mist effect": "Apply a soft mist effect to the lettering featuring translucent atmospheric layers, gentle drifting vapor, subtle edge diffusion, smooth depth transitions, and light fog-like movement surrounding every letter. The lettering should feel mysterious, ethereal, calm, and naturally surrounded by delicate mist.",
    "diamond": "Apply a brilliant diamond finish to the lettering featuring precision-cut faceted crystal surfaces, exceptional light refraction, dazzling sparkle, luxurious gemstone clarity, and premium dimensional brilliance throughout every letter. The lettering should appear sculpted entirely from flawless diamonds with breathtaking reflective depth.",
    "glitter": "Apply a dazzling glitter finish to the lettering featuring densely packed sparkling particles, brilliant micro-reflections, shimmering surface texture, and rich luminous sparkle throughout every letter. The lettering should feel festive, eye-catching, playful, and irresistibly sparkly.",
    "gold leaf foil": "Apply an authentic gold leaf finish to the lettering featuring rich hand-laid metallic leaf, delicate organic texture, luxurious reflective highlights, subtle natural imperfections, and premium artisan craftsmanship throughout every letter. The lettering should feel elegant, timeless, handcrafted, and exceptionally luxurious.",
    "pearl finish": "Apply an elegant pearl finish to the lettering featuring soft lustrous reflections, delicate pearlescent sheen, smooth satin-like surfaces, subtle iridescent highlights, and refined dimensional depth throughout every letter. The lettering should feel timeless, luxurious, sophisticated, and naturally radiant.",
    "rhinestone": "Apply a premium rhinestone finish to the lettering featuring individually placed sparkling rhinestones, brilliant faceted reflections, polished gem settings, dimensional gemstone depth, and luxurious crystal detailing throughout every letter. The lettering should feel glamorous, bold, luxurious, and expertly embellished.",
    "candy coated": "Apply a premium candy-coated finish to the lettering featuring a thick glossy candy shell, brilliant reflective highlights, smooth polished surfaces, rich color saturation, and luxurious confectionery shine throughout every letter. The lettering should appear vibrant, playful, polished, and professionally candy coated.",
    "gummy candy": "Apply a premium gummy candy finish to the lettering featuring thick translucent candy material, soft rounded edges, realistic chewy texture, subtle internal light diffusion, and glossy confectionery reflections throughout every letter. The lettering should appear soft, playful, colorful, and irresistibly chewy with rich dimensional depth and authentic candy realism.",
    "jelly texture": "Apply a glossy jelly finish to the lettering featuring translucent gel-like depth, smooth rounded surfaces, soft internal reflections, rich dimensional volume, and premium flexible material realism throughout every letter. The lettering should appear soft, playful, vibrant, and irresistibly squishable with luxurious glossy depth.",
    "liquid ripple": "Apply a flowing liquid ripple finish to the lettering featuring smooth fluid movement, realistic surface waves, gentle rippling reflections, glossy liquid depth, and continuous motion across every letter. The lettering should appear sculpted from moving liquid with elegant flowing contours and mesmerizing reflective dimension.",
    "marshmallow puff": "Apply a soft marshmallow finish to the lettering featuring pillowy rounded forms, fluffy inflated volume, smooth velvety surfaces, subtle soft highlights, and plush dimensional depth throughout every letter. The lettering should feel airy, comforting, playful, and irresistibly soft with a premium confection-inspired appearance.",
    "3d extruded": "Apply a dramatic three-dimensional extruded finish to the lettering featuring deep structural extrusion, realistic perspective, layered dimensional construction, crisp edge definition, rich shadow depth, and premium architectural realism throughout every letter. The lettering should feel bold, substantial, professionally engineered, and visually commanding.",
    "chrome gradient warm": "Apply a warped chrome finish to the lettering featuring flowing metallic reflections, liquid mirror distortions, curved reflective gradients, polished chrome surfaces, and rich dimensional depth that creates the appearance of fluid sculpted metal. Every letter should feel futuristic, premium, and dynamically reflective.",
    "glitch texture": "Apply a digital glitch finish to the lettering featuring fragmented visual distortions, pixel displacement, scanline interference, subtle RGB separation, and layered digital artifacts that enhance the typography without compromising readability. The lettering should feel futuristic, energetic, and inspired by modern digital aesthetics.",
    "holographic": "Apply a vibrant holographic finish to the lettering featuring brilliant iridescent color shifts, luminous spectral reflections, smooth prismatic transitions, rich dimensional depth, and premium rainbow light effects that change naturally across every surface. The lettering should feel futuristic, luxurious, and visually mesmerizing.",
    "holographic shift": "Apply a premium holographic color-shifting finish to the lettering featuring fluid iridescent reflections, dynamic spectral color transitions, luminous rainbow highlights, and rich prismatic depth that changes naturally with the viewing angle. Every letter should feel futuristic, luxurious, and visually mesmerizing.",
    "pixel distortion": "Apply a pixel distortion finish to the lettering featuring intentional pixel breakup, digital fragmentation, blocky transitions, retro gaming artifacts, and subtle electronic distortion while maintaining strong readability. Every letter should feel modern, nostalgic, experimental, and digitally stylized.",
    "chalk finish": "Apply an authentic chalk finish to the lettering featuring soft powdery texture, natural chalk dust, hand-drawn edge variation, subtle smudging, and realistic blackboard-style character throughout every letter. The lettering should feel handcrafted, artistic, nostalgic, and naturally illustrated with genuine chalk realism.",
    "cracked paint": "Apply a beautifully aged cracked paint finish to the lettering featuring naturally weathered surfaces, authentic crack patterns, peeling paint layers, vintage wear, subtle distressed depth, and realistic aged character throughout every letter. The lettering should feel nostalgic, artistic, weathered, and full of timeless personality.",
    "distressed grunge": "Apply a distressed grunge finish to the lettering featuring worn edges, cracked surfaces, faded imperfections, weathered texture, layered abrasion, and naturally aged character throughout every letter. The finish should feel authentic, rugged, rebellious, and full of vintage personality without sacrificing readability.",
    "ink bleed": "Apply a rich ink bleed finish to the lettering featuring saturated ink edges, subtle feathering, natural capillary spread, handcrafted print imperfections, and organic fluid transitions throughout every letter. The lettering should feel artistic, expressive, vintage, and authentically produced with traditional ink techniques.",
    "spray paint": "Apply an authentic spray paint finish to the lettering featuring soft aerosol fades, layered paint coverage, natural overspray, subtle paint speckling, smooth gradient transitions, and rich urban street-art realism throughout every letter. The lettering should feel energetic, expressive, handcrafted, and unmistakably inspired by authentic graffiti techniques.",
    "watercolor": "Apply a premium watercolor finish to the lettering featuring translucent layered pigments, soft paint blooms, organic brush movement, subtle paper absorption, and naturally blended color transitions throughout every letter. The lettering should feel artistic, elegant, expressive, and beautifully hand painted.",
  };

  var BACKGROUND_OPTIONS = sortAlpha([
    "clean white", "gradient", "paint splatter", "themed scene", "transparent", "smoke/clouds",
    // new
    "halftone dot pattern", "bokeh light blur", "geometric pattern",
  ]);

  var TEXT_SPACING_OPTIONS = ["ultra tight", "slightly tight", "balanced", "airy", "ultra wide"];

  var WORD_SHAPE_OPTIONS = sortAlpha([
    "straight line", "arched", "wave", "circular", "vertical stack", "pyramid",
    "scattered", "spiral", "zig-zag", "explosion layout",
    // new
    "diagonal slant", "heart shape", "starburst radial",
  ]);

  var WORD_STACK_OPTIONS = sortAlpha(["one line only", "multi line", "line per word"]);

  // Second Phrase's own relationship to the main text — "inline accent"
  // covers the original one-word-called-out-within-a-sentence case (e.g.
  // "Blessed" inside "Blessed Mama"); the other 3 cover a fully separate
  // second line/phrase with its own typography (e.g. a call-and-response
  // design: "Do You Trust Me" / "Well, Do Ya?").
  var ACCENT_POSITION_OPTIONS = sortAlpha([
    "inline accent within main text", "below main text", "above main text", "beside main text",
  ]);

  var ICON_PACKS_OPTIONS = sortAlpha([
    "none", "hearts", "sparkles", "money bags", "music notes", "roses", "cute stars",
    "floating dots", "clouds", "bubbles", "sunflowers", "kissy lips", "dollar signs",
    "bows", "diamonds", "90s hip hop", "zodiac", "kawaii", "makeup", "basketballs",
    "faith/scripture (cross, dove, olive branch)", "military/veteran (dog tags, stars, flag element)",
    "nurse (caduceus, stethoscope, heart monitor line)", "teacher (apple, pencil, books)",
    "firefighter (helmet, flame, maltese cross)", "small business owner (box, growth arrow, coffee cup)",
    // new
    "coffee/cafe icons", "beach/tropical icons", "gaming/controller icons",
  ]);

  var ADD_ONS_OPTIONS = sortAlpha([
    "none", "thin white outline", "thin pink outline", "thin gradient outline",
    "thick white outline", "thick black outline", "double outline", "embossed layers",
    "drop shadow", "stitched border", "camera lights",
    // new
    "glow outline", "confetti scatter overlay", "grain/noise overlay",
  ]);

  // Second Phrase sub-panel — lets the shopper call out one word inline
  // (e.g. "Blessed" in cursive gold inside "Blessed Mama") OR add a fully
  // separate second line/phrase with its own typography and position
  // relative to the main text (e.g. a call-and-response design: "Do You
  // Trust Me" / "Well, Do Ya?" positioned below). Reuses the exact same 4
  // option lists as Core Style (Letter Style/Color Scheme/Text Case/Text
  // Effects) rather than a separate smaller list, so it gets the same
  // depth of control as the main text.

  // No separate Surface Texture here — Text Effects's own Material /
  // Surface category absorbed it (see TEXT_EFFECTS_GROUPS above), so the
  // two don't read as two overlapping answers to the same question.
  // Order follows the owner's Text Prompt Order spec (Letter Style ->
  // Color Scheme -> Text Effects, Text Content pulled into its own
  // opening sentence in assemblePrompt() below rather than riding in this
  // "Maintain: ..." list — see the intro construction there).
  var FIXED_LABELS = {
    yourText: "Text Content",
    letterStyle: "Letter Style",
    colorScheme: "Color Scheme",
    textCase: "Text Case",
    textEffects: "Text Effects",
  };
  // Order follows the spec's Text Spacing -> Layout (Word Shape/Word
  // Stack) -> Icon Packs -> Background -> Add-Ons.
  var VARIABLE_LABELS = {
    textSpacing: "Text Spacing",
    wordShape: "Word Shape",
    wordStack: "Word Stack",
    iconPacks: "Icon Pack",
    background: "Background",
    addOns: "Add-Ons",
  };

  // ---------------------------------------------------------------------
  // State — flat, matching the build plan's textConfig shape. "Core
  // Style" fields stay fixed across the 4 variations the meta-instruction
  // prompt asks for; "Variation Details" are what's free to vary.
  // ---------------------------------------------------------------------
  function buildInitialState() {
    return {
      yourText: makeField("", [], { isFreeText: true }),
      letterStyle: makeField("", LETTER_STYLE_OPTIONS),
      colorScheme: PromptHaus.util.makeGroupedField("", COLOR_SCHEME_GROUPS),
      textCase: makeField("", TEXT_CASE_OPTIONS),
      textEffects: PromptHaus.util.makeGroupedField("", TEXT_EFFECTS_GROUPS),
      background: makeField("", BACKGROUND_OPTIONS),
      textSpacing: makeField("balanced", TEXT_SPACING_OPTIONS),
      wordShape: makeField("", WORD_SHAPE_OPTIONS),
      wordStack: makeField("", WORD_STACK_OPTIONS),
      iconPacks: makeField("none", ICON_PACKS_OPTIONS),
      addOns: makeField("none", ADD_ONS_OPTIONS),
      accent: {
        include: false,
        phrase: makeField("", [], { isFreeText: true }),
        letterStyle: makeField("", LETTER_STYLE_OPTIONS),
        colorScheme: PromptHaus.util.makeGroupedField("", COLOR_SCHEME_GROUPS),
        textCase: makeField("", TEXT_CASE_OPTIONS),
        // Text Effects replaces Surface Texture here too — same widget as
        // Core Style's, so the accent phrase gets the same depth of
        // control (glow/atmosphere/decorative finish, not just a plain
        // material texture).
        textEffects: PromptHaus.util.makeGroupedField("", TEXT_EFFECTS_GROUPS),
        position: makeField("", ACCENT_POSITION_OPTIONS),
      },
    };
  }

  var store = PromptHaus.util.createStore(buildInitialState());

  function updateField(fieldName, changes) {
    var state = store.getState();
    var patch = {};
    patch[fieldName] = Object.assign({}, state[fieldName], changes);
    store.setState(patch);
  }

  function toggleAccentInclude(include) {
    var state = store.getState();
    store.setState({ accent: Object.assign({}, state.accent, { include: include }) });
  }

  function updateAccentField(fieldName, changes) {
    var state = store.getState();
    var patch = {};
    patch[fieldName] = Object.assign({}, state.accent[fieldName], changes);
    store.setState({ accent: Object.assign({}, state.accent, patch) });
  }

  var ACCENT_STYLE_LABELS = {
    letterStyle: "Letter Style",
    colorScheme: "Color Scheme",
    textCase: "Text Case",
    textEffects: "Text Effects",
  };

  function getAccentStyleEntries() {
    var accent = store.getState().accent;
    return Object.keys(ACCENT_STYLE_LABELS).map(function (fieldName) {
      return { fieldName: fieldName, label: ACCENT_STYLE_LABELS[fieldName], field: accent[fieldName] };
    });
  }

  // Composes the accent phrase + its own Letter Style/Color Scheme/Text
  // Case/Text Effects into a short run of grammatically complete
  // sentences — null when the shopper hasn't opted in or hasn't typed a
  // phrase yet. Letter Style/Color Scheme/Text Effects carry full
  // descriptive paragraphs (chunk 3), not short words, so they can't be
  // glued onto "styled with ..." the way the original one-word-accent
  // version did (that produced broken output like 'styled with Create
  // aggressive heavy metal typography for a t-shirt design...'). Each
  // paragraph gets its own labeled sentence instead.
  //
  // Position changes the framing entirely, not just adds a detail: a
  // Position other than the inline default means this isn't one word
  // called out inside the main sentence (e.g. "Blessed" in "Blessed
  // Mama") — it's a fully separate second line/phrase with its own
  // typography (e.g. a call-and-response design: "Do You Trust Me" /
  // "Well, Do Ya?"), so it needs its own "second line of text" wording
  // rather than "set apart from the rest of the text," which implies it's
  // carved out of the main text instead of standing beside it.
  function buildAccentField() {
    var state = store.getState();
    if (!state.accent.include) return null;
    var phrase = (state.accent.phrase.value || "").trim();
    if (!phrase) return null;

    var accent = state.accent;
    var letterStyleText = PromptHaus.engine.resolveFieldValue(withParagraphLookup({ fieldName: "letterStyle", field: accent.letterStyle }).field);
    var colorSchemeText = PromptHaus.engine.resolveFieldValue(withParagraphLookup({ fieldName: "colorScheme", field: accent.colorScheme }).field);
    var textEffectsText = PromptHaus.engine.resolveFieldValue(withParagraphLookup({ fieldName: "textEffects", field: accent.textEffects }).field);
    var textCaseText = PromptHaus.engine.resolveFieldValue(accent.textCase);

    var position = PromptHaus.engine.resolveFieldValue(state.accent.position);
    var isSeparateLine = position && position !== "inline accent within main text";
    var subject = isSeparateLine ? 'a second line of text reading "' + phrase + '"' : 'the word/phrase "' + phrase + '"';

    var openingBits = ["Also include " + subject];
    if (isSeparateLine) {
      openingBits.push("positioned " + position);
    } else {
      openingBits.push("set apart from the rest of the text with its own distinct styling");
    }
    if (textCaseText) openingBits.push("in " + textCaseText);
    var sentences = [openingBits.join(", ") + "."];

    if (letterStyleText) sentences.push("Letter style for this second phrase: " + letterStyleText);
    if (colorSchemeText) sentences.push("Color scheme for this second phrase: " + colorSchemeText);
    if (textEffectsText) sentences.push("Text effects for this second phrase: " + textEffectsText);

    return makeField(sentences.join(" "));
  }

  // Letter Style/Color Scheme/Text Effects show a short label in the
  // dropdown but need to contribute their full descriptive paragraph to
  // the assembled prompt — used only at assembly time (assemblePrompt,
  // buildAccentField), never by the UI renderer, so the "Core Style"/
  // "Second Phrase Details" dropdowns keep showing short labels correctly.
  var PARAGRAPH_LOOKUP_BY_FIELD = {
    letterStyle: LETTER_STYLE_PROMPTS,
    colorScheme: COLOR_SCHEME_PROMPTS,
    textEffects: TEXT_EFFECTS_PROMPTS,
  };
  function withParagraphLookup(e) {
    var lookup = PARAGRAPH_LOOKUP_BY_FIELD[e.fieldName];
    if (!lookup) return { label: e.label, field: e.field };
    var field = PromptHaus.engine.withPromptLookup(e.field, lookup);
    // Letter Style's paragraphs carry a literal "<product type>" token
    // (e.g. "...typography for a <product type>.") meant to be filled in
    // dynamically, not shipped verbatim.
    if (e.fieldName === "letterStyle" && field.value && field.value.indexOf("<product type>") !== -1) {
      field = Object.assign({}, field, { value: field.value.split("<product type>").join(PromptHaus.styleDNA.getProjectTypeValue()) });
    }
    return { label: e.label, field: field };
  }

  function getFixedEntries() {
    var state = store.getState();
    return Object.keys(FIXED_LABELS).map(function (fieldName) {
      return { fieldName: fieldName, label: FIXED_LABELS[fieldName], field: state[fieldName] };
    });
  }

  function getVariableEntries() {
    var state = store.getState();
    return Object.keys(VARIABLE_LABELS).map(function (fieldName) {
      return { fieldName: fieldName, label: VARIABLE_LABELS[fieldName], field: state[fieldName] };
    });
  }

  var PROMPT_OUTRO =
    "High quality digital illustration, immaculate composition, vibrant and polished finish with professional rendering.";

  // extraFixedEntries lets Combined Mode layer in the live-linked mascot
  // description (and its alignment) without duplicating this assembler —
  // standalone Text Mode never passes anything, so its output is unchanged.
  //
  // Letter Style/Color Scheme/Text Effects (and the Second Phrase clause,
  // which draws on the same three) carry full descriptive paragraphs
  // (chunk 3), not short words — comma-joining a multi-sentence paragraph
  // into the "Maintain: ..." list next to short fields like Holiday/Mood
  // reads as broken grammar. Pulled into their own intro sentences instead,
  // mirroring Character Mode's Illustration Style/Art Finish pattern; only
  // genuinely short, comma-joinable fields stay in the Maintain list.
  function assemblePrompt(extraFixedEntries) {
    var toEntry = function (e) {
      return { label: e.label, field: e.field };
    };
    var state = store.getState();
    var yourTextValue = PromptHaus.engine.resolveFieldValue(state.yourText);
    var letterStyleText = PromptHaus.engine.resolveFieldValue(withParagraphLookup({ fieldName: "letterStyle", field: state.letterStyle }).field);
    var colorSchemeText = PromptHaus.engine.resolveFieldValue(withParagraphLookup({ fieldName: "colorScheme", field: state.colorScheme }).field);
    var textEffectsText = PromptHaus.engine.resolveFieldValue(withParagraphLookup({ fieldName: "textEffects", field: state.textEffects }).field);
    var textCaseText = PromptHaus.engine.resolveFieldValue(state.textCase);

    var introParts = [];
    introParts.push(
      yourTextValue
        ? 'Create a bold, eye-catching text art image that says "' + yourTextValue + '".'
        : "Create a bold, eye-catching text art image."
    );
    if (letterStyleText) introParts.push("Letter style: " + letterStyleText);
    if (colorSchemeText) introParts.push("Color scheme: " + colorSchemeText);
    if (textEffectsText) introParts.push("Text effects: " + textEffectsText);
    if (textCaseText) introParts.push("Render the text in " + textCaseText + ".");
    var accentField = buildAccentField();
    if (accentField) {
      var accentText = PromptHaus.engine.resolveFieldValue(accentField);
      if (accentText) introParts.push(accentText);
    }

    var fixedEntries = [];
    // Holiday, Creative Theme, Niche, Target Audience, Mood, Filter, and
    // Buffer/Padding live in shared Style DNA — stay fixed across
    // variations same as everything else in Core Style.
    fixedEntries.push({ label: "Holiday", field: PromptHaus.styleDNA.getState().holiday });
    fixedEntries.push({ label: "Creative Theme", field: PromptHaus.styleDNA.getState().theme });
    fixedEntries.push({ label: "Niche", field: PromptHaus.styleDNA.getState().niche });
    fixedEntries.push({ label: "Target Audience", field: PromptHaus.styleDNA.getState().targetAudience });
    fixedEntries.push({ label: "Mood", field: PromptHaus.styleDNA.getState().mood });
    fixedEntries.push({ label: "Filter It", field: PromptHaus.styleDNA.getState().filter });
    fixedEntries = fixedEntries.concat(PromptHaus.styleDNA.getImageryEntries());
    fixedEntries = fixedEntries.concat(PromptHaus.brandKit.getActiveKitEntries());
    var projectTypeEntry = PromptHaus.styleDNA.getProjectTypeEntry("text");
    if (projectTypeEntry) fixedEntries.push(projectTypeEntry);
    var bufferEntry = PromptHaus.styleDNA.getBufferEntry();
    if (bufferEntry) fixedEntries.push(bufferEntry);
    if (extraFixedEntries && extraFixedEntries.length) fixedEntries = fixedEntries.concat(extraFixedEntries);

    var intro = introParts.join(" ");

    // variationCount is always forced to 1 here regardless of the
    // Variations dropdown: the "Maintain: X. Vary between the N
    // variations: Y." framing buildMetaInstruction produces for count > 1
    // reads to some image models as a request for a single comparison
    // sheet/grid rather than N separate images — the exact bug this was
    // meant to prevent, not avoid. The copied text always describes one
    // image; running it multiple times (optionally hand-adjusting the
    // Variation Details fields between runs) is how multiple distinct
    // results are produced.
    return PromptHaus.engine.buildMetaInstruction({
      intro: intro,
      fixedFieldEntries: fixedEntries,
      variableFieldEntries: getVariableEntries().map(toEntry),
      variationCount: 1,
      outro: PROMPT_OUTRO,
    });
  }

  function randomize() {
    getFixedEntries().concat(getVariableEntries()).forEach(function (e) {
      if (e.fieldName === "yourText") return; // free text is never randomized
      if (!e.field.includeInPrompt) return;
      var options = e.field.options || [];
      if (!options.length) return;
      var randomValue = options[Math.floor(Math.random() * options.length)];
      updateField(e.fieldName, { value: randomValue, customValue: "" });
    });
    // Accent's own style fields (and Position) may randomize too, but the
    // typed phrase itself never does.
    var state = store.getState();
    if (state.accent.include) {
      getAccentStyleEntries().forEach(function (e) {
        if (!e.field.includeInPrompt) return;
        var options = e.field.options || [];
        if (!options.length) return;
        var randomValue = options[Math.floor(Math.random() * options.length)];
        updateAccentField(e.fieldName, { value: randomValue, customValue: "" });
      });
      if (state.accent.position.includeInPrompt) {
        var positionOptions = state.accent.position.options || [];
        if (positionOptions.length) {
          updateAccentField("position", {
            value: positionOptions[Math.floor(Math.random() * positionOptions.length)],
            customValue: "",
          });
        }
      }
    }
    PromptHaus.styleDNA.randomizeContent();
  }

  function reset() {
    store.setState(buildInitialState());
    PromptHaus.styleDNA.resetContent();
  }

  // Mirrors Character Mode's getSelectionsByGroup() — feeds the "Your
  // Selections" panel, grouped the same way the field panel itself is.
  function getSelectionsByGroup() {
    var toEntry = function (e) {
      return { label: e.label, field: e.field };
    };
    var groups = [];

    var coreResolved = PromptHaus.engine.resolveFields(getFixedEntries().map(toEntry));
    if (coreResolved.length) groups.push({ title: "Core Style", items: coreResolved });

    var accentField = buildAccentField();
    if (accentField) {
      groups.push({
        title: "Second Phrase",
        items: [{ label: "Second Phrase", value: PromptHaus.engine.resolveFieldValue(accentField) }],
      });
    }

    var variableResolved = PromptHaus.engine.resolveFields(getVariableEntries().map(toEntry));
    if (variableResolved.length) groups.push({ title: "Variation Details", items: variableResolved });

    var holidayResolved = PromptHaus.engine.resolveFields([
      { label: "Holiday", field: PromptHaus.styleDNA.getState().holiday },
      { label: "Creative Theme", field: PromptHaus.styleDNA.getState().theme },
      { label: "Niche", field: PromptHaus.styleDNA.getState().niche },
      { label: "Target Audience", field: PromptHaus.styleDNA.getState().targetAudience },
      { label: "Mood", field: PromptHaus.styleDNA.getState().mood },
      { label: "Filter It", field: PromptHaus.styleDNA.getState().filter },
    ]);
    if (holidayResolved.length) groups.push({ title: "Concept & Filter", items: holidayResolved });

    var imageryEntries = PromptHaus.styleDNA.getImageryEntries();
    if (imageryEntries.length) {
      groups.push({
        title: "Imagery & Scene Elements",
        items: imageryEntries.map(function (e) {
          return { label: e.label, value: e.field.value };
        }),
      });
    }

    var bufferEntry = PromptHaus.styleDNA.getBufferEntry();
    if (bufferEntry) groups.push({ title: "Image Buffer/Padding", items: [{ label: bufferEntry.label, value: bufferEntry.field.value }] });

    return groups;
  }

  // ---------------------------------------------------------------------
  // Starter Presets — sets Core Style/Variation Details fields only,
  // never Text Content itself (yourText stays whatever the shopper typed).
  // ---------------------------------------------------------------------
  var PRESETS = [
    {
      id: "boldStatementTee",
      name: "Bold Statement Tee",
      description: "Chunky varsity letters, vibrant multicolor, uppercase.",
      apply: function () {
        updateField("letterStyle", { value: "chunky varsity letters", customValue: "" });
        updateField("colorScheme", { value: "vibrant multicolor", customValue: "" });
        updateField("textCase", { value: "uppercase", customValue: "" });
      },
    },
    {
      id: "bohoScript",
      name: "Boho Script",
      description: "Calligraphy lettering, pastel gradient color scheme, title case.",
      apply: function () {
        updateField("letterStyle", { value: "calligraphy", customValue: "" });
        updateField("colorScheme", { value: "pastel gradient", customValue: "" });
        updateField("textCase", { value: "title case", customValue: "" });
      },
    },
    {
      id: "retroVarsityText",
      name: "Retro Varsity Text",
      description: "Chenille varsity patch lettering, bold gradient blend.",
      apply: function () {
        updateField("letterStyle", { value: "chenille varsity patch", customValue: "" });
        updateField("colorScheme", { value: "bold gradient blend", customValue: "" });
      },
    },
    {
      id: "faithBasedScript",
      name: "Faith-Based Script",
      description: "Brush lettering script, champagne gold color scheme.",
      apply: function () {
        updateField("letterStyle", { value: "brush lettering script", customValue: "" });
        updateField("colorScheme", { value: "champagne gold", customValue: "" });
      },
    },
  ];

  PromptHaus.text = Object.assign({}, store, {
    presets: PRESETS,
    updateField: updateField,
    getSelectionsByGroup: getSelectionsByGroup,
    toggleAccentInclude: toggleAccentInclude,
    updateAccentField: updateAccentField,
    getFixedEntries: getFixedEntries,
    getVariableEntries: getVariableEntries,
    buildAccentField: buildAccentField,
    assemblePrompt: assemblePrompt,
    randomize: randomize,
    reset: reset,
    // Single source of truth for option lists other modes need to reuse
    // (Reference Mode now) rather than duplicating them.
    optionLists: {
      letterStyle: LETTER_STYLE_OPTIONS,
      letterStylePrompts: LETTER_STYLE_PROMPTS,
      colorSchemeGroups: COLOR_SCHEME_GROUPS,
      colorSchemePrompts: COLOR_SCHEME_PROMPTS,
      textCase: TEXT_CASE_OPTIONS,
      textEffectsGroups: TEXT_EFFECTS_GROUPS,
      textEffectsPrompts: TEXT_EFFECTS_PROMPTS,
    },
  });
})();
