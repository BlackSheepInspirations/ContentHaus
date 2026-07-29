/**
 * The AI Creator's Project Haus — Event Checklist content library
 * Pure data, no dependencies. Loaded before
 * product-haus-generators-eventchecklist.js, which imports
 * EVENT_TYPE_OPTIONS and EVENT_CHECKLIST_LIBRARY from
 * window.ProductHausEventChecklists.
 *
 * One entry per event type, each a { sections: [{ id, label, items }] }
 * object consumed by product-haus-generators.js's Checklist Items
 * capability (checklistSourceField/checklistLibrary). Section shape
 * follows whatever's natural per event — month-phased for long-lead
 * events, week/day-phased for short-lead ones, plain categorical for
 * others — not one shared template with swapped-in words.
 *
 * Wedding's sections/items are transcribed directly from the owner's own
 * reference image (a real "Wedding Planning Checklist" product) rather
 * than authored from scratch like the other 16 — the most granular
 * entry here on purpose, since it's following an actual proven product
 * instead of a one-line hint.
 */
(function () {
  "use strict";

  var EVENT_TYPE_OPTIONS = [
    "Wedding",
    "Baby Shower",
    "Birthday Party",
    "Graduation Party",
    "Anniversary Celebration",
    "Corporate Event / Conference",
    "Fundraiser / Charity Gala",
    "Family Reunion",
    "Retirement Party",
    "Holiday Gathering",
    "Product Launch",
    "Pop-Up Shop / Market Booth",
    "Community Festival",
    "Religious Celebration",
    "Memorial / Celebration of Life",
    "Moving / Housewarming",
    "Vacation / Group Trip",
  ];

  var EVENT_CHECKLIST_LIBRARY = {
    "Wedding": {
      sections: [
        { id: "s12", label: "12 MONTHS BEFORE", items: ["Set a budget", "Make a guest list", "Choose bridal party", "Hire a wedding planner", "Decide style and theme", "Choose a venue", "Sample & select a caterer"] },
        { id: "s11", label: "11 MONTHS BEFORE", items: ["Choose color scheme", "Hire photographer & videographer", "Hire band or DJ"] },
        { id: "s10", label: "10 MONTHS BEFORE", items: ["Wedding dress shopping", "Order invitations"] },
        { id: "s9", label: "9 MONTHS BEFORE", items: ["Buy dress"] },
        { id: "s8", label: "8 MONTHS BEFORE", items: ["Choose bridesmaids dresses", "Choose flowers"] },
        { id: "s7", label: "7 MONTHS BEFORE", items: ["Book rehearsal dinner venue", "Choose music for ceremony", "Order decorations", "Hire officiant"] },
        { id: "s6", label: "6 MONTHS BEFORE", items: ["Book transport for guests", "Book transport for you"] },
        { id: "s5", label: "5 MONTHS BEFORE", items: ["Book honeymoon", "Book or rent men's tuxedos"] },
        { id: "s4", label: "4 MONTHS BEFORE", items: ["Choose cake", "Buy wedding bands", "Hair & makeup trial"] },
        { id: "s3", label: "3 MONTHS BEFORE", items: ["Choose guest favors", "Write vows", "Select readings"] },
        { id: "s2", label: "2 MONTHS BEFORE", items: ["Dress fitting", "Pick up marriage license", "Break in wedding shoes"] },
        { id: "s1", label: "1 MONTH BEFORE", items: ["Assemble gift bags", "Pay vendors in full", "Create seating chart", "Venue walk-through", "Hair color refresh", "Mani/pedi", "Final dress fitting", "Practice vows out loud"] },
        { id: "s0", label: "NIGHT BEFORE", items: ["Eat a healthy meal", "Drink water", "Get a good night's sleep"] },
      ],
    },
    "Baby Shower": {
      sections: [
        { id: "s1", label: "2 MONTHS BEFORE", items: ["Set a budget", "Choose a date & venue", "Decide on a theme", "Create the guest list", "Set up the registry"] },
        { id: "s2", label: "1 MONTH BEFORE", items: ["Send invitations", "Plan games & activities", "Order/make decorations", "Choose a menu & order catering", "Order the cake"] },
        { id: "s3", label: "2 WEEKS BEFORE", items: ["Order favors", "Confirm final guest count", "Buy games & prize supplies", "Prep a playlist"] },
        { id: "s4", label: "WEEK OF", items: ["Pick up decorations & supplies", "Confirm catering delivery time", "Prep favor bags", "Charge camera / set up photo area"] },
        { id: "s5", label: "DAY OF", items: ["Set up decorations & food table", "Set out guest book & registry cards", "Assign someone to take photos", "Relax & enjoy!"] },
      ],
    },
    "Birthday Party": {
      sections: [
        { id: "s1", label: "6 WEEKS BEFORE", items: ["Set a budget", "Pick a date & venue", "Choose a theme", "Make the guest list"] },
        { id: "s2", label: "4 WEEKS BEFORE", items: ["Send invitations", "Book entertainment (if any)", "Order/plan the cake", "Plan the menu"] },
        { id: "s3", label: "2 WEEKS BEFORE", items: ["Order decorations & balloons", "Plan games & activities", "Order party favors", "Confirm RSVPs"] },
        { id: "s4", label: "WEEK OF", items: ["Buy remaining groceries & supplies", "Wrap gifts (if hosting)", "Confirm entertainment/vendor arrival times", "Prep a playlist"] },
        { id: "s5", label: "DAY OF", items: ["Set up decorations", "Set up food & cake table", "Coordinate surprise timing (if applicable)", "Take lots of photos"] },
      ],
    },
    "Graduation Party": {
      sections: [
        { id: "s1", label: "6 WEEKS BEFORE", items: ["Set a budget", "Choose a date & venue", "Make the guest list", "Order graduation announcements"] },
        { id: "s2", label: "4 WEEKS BEFORE", items: ["Send invitations/announcements", "Plan the menu & order catering", "Choose a theme / school colors", "Order the cake"] },
        { id: "s3", label: "2 WEEKS BEFORE", items: ["Order decorations", "Print photos for a memory display", "Confirm final headcount", "Plan a slideshow"] },
        { id: "s4", label: "WEEK OF", items: ["Pick up decorations & supplies", "Set up memory/photo display materials", "Confirm catering delivery"] },
        { id: "s5", label: "DAY OF", items: ["Set up decorations & photo display", "Set up food table", "Display the guest book", "Capture photos throughout"] },
      ],
    },
    "Anniversary Celebration": {
      sections: [
        { id: "s1", label: "2 MONTHS BEFORE", items: ["Set a budget", "Choose a date & venue", "Decide if renewing vows", "Make the guest list"] },
        { id: "s2", label: "1 MONTH BEFORE", items: ["Send invitations", "Book entertainment/music", "Plan the menu & order catering", "Order a cake"] },
        { id: "s3", label: "2 WEEKS BEFORE", items: ["Create a memory/photo display", "Order flowers & decorations", "Confirm final headcount", "Plan any speeches/toasts"] },
        { id: "s4", label: "WEEK OF", items: ["Pick up decorations & supplies", "Confirm vendor arrival times", "Prep the memory display"] },
        { id: "s5", label: "DAY OF", items: ["Set up decorations & memory display", "Greet guests", "Capture photos & video", "Enjoy the celebration!"] },
      ],
    },
    "Corporate Event / Conference": {
      sections: [
        { id: "s1", label: "3 MONTHS BEFORE", items: ["Set a budget", "Choose a date & venue", "Confirm speakers/presenters", "Reach out to sponsors"] },
        { id: "s2", label: "2 MONTHS BEFORE", items: ["Open registration", "Plan the agenda", "Book catering", "Order signage & branding materials"] },
        { id: "s3", label: "1 MONTH BEFORE", items: ["Confirm AV/tech setup", "Send reminder emails to registrants", "Finalize sponsor deliverables", "Order name badges/materials"] },
        { id: "s4", label: "2 WEEKS BEFORE", items: ["Confirm final headcount with venue & caterer", "Print materials & signage", "Brief speakers on logistics", "Test all tech/AV equipment"] },
        { id: "s5", label: "DAY OF", items: ["Set up registration table & signage", "Do a tech/AV check", "Greet speakers & sponsors", "Distribute materials to attendees"] },
      ],
    },
    "Fundraiser / Charity Gala": {
      sections: [
        { id: "s1", label: "3 MONTHS BEFORE", items: ["Set a fundraising goal & budget", "Choose a date & venue", "Recruit committee & volunteers", "Reach out to sponsors"] },
        { id: "s2", label: "2 MONTHS BEFORE", items: ["Open ticket sales", "Collect auction/raffle items", "Plan the program & speakers", "Launch promotion (social/email)"] },
        { id: "s3", label: "1 MONTH BEFORE", items: ["Confirm catering & bar service", "Finalize auction item list & descriptions", "Recruit day-of volunteers", "Order signage & decor"] },
        { id: "s4", label: "2 WEEKS BEFORE", items: ["Confirm final headcount", "Prep auction/raffle display materials", "Brief volunteers on roles", "Send reminder emails to attendees"] },
        { id: "s5", label: "DAY OF", items: ["Set up registration & auction displays", "Brief volunteers", "Welcome donors & sponsors", "Track & announce funds raised"] },
      ],
    },
    "Family Reunion": {
      sections: [
        { id: "s1", label: "3 MONTHS BEFORE", items: ["Set a budget", "Choose a date & location", "Book a venue/lodging block", "Create a group chat or email list"] },
        { id: "s2", label: "2 MONTHS BEFORE", items: ["Send save-the-dates", "Plan meals & assign potluck dishes", "Order family shirts", "Plan activities & games"] },
        { id: "s3", label: "1 MONTH BEFORE", items: ["Confirm headcount & lodging", "Plan a family photo session", "Prepare a family update/newsletter", "Buy supplies for activities"] },
        { id: "s4", label: "2 WEEKS BEFORE", items: ["Confirm travel arrangements", "Pack decorations & games", "Finalize the meal schedule", "Print family shirts/name tags"] },
        { id: "s5", label: "DAY OF", items: ["Set up the gathering space", "Organize the family photo", "Kick off activities & games", "Share the family update"] },
      ],
    },
    "Retirement Party": {
      sections: [
        { id: "s1", label: "6 WEEKS BEFORE", items: ["Set a budget", "Choose a date & venue", "Make the guest list", "Ask a few people to give speeches"] },
        { id: "s2", label: "4 WEEKS BEFORE", items: ["Send invitations", "Start collecting photos for a slideshow", "Order a cake", "Plan the menu & catering"] },
        { id: "s3", label: "2 WEEKS BEFORE", items: ["Finalize the slideshow", "Set up a memory book/card station", "Order decorations", "Confirm final headcount"] },
        { id: "s4", label: "WEEK OF", items: ["Pick up decorations & supplies", "Confirm speech order & timing", "Test slideshow equipment", "Wrap the retirement gift"] },
        { id: "s5", label: "DAY OF", items: ["Set up decorations & memory book station", "Run the slideshow", "Coordinate speeches", "Present the gift"] },
      ],
    },
    "Holiday Gathering": {
      sections: [
        { id: "s1", label: "6 WEEKS BEFORE", items: ["Set a budget", "Decide on the guest list & date", "Plan the menu", "Decide on a gift exchange (if any)"] },
        { id: "s2", label: "4 WEEKS BEFORE", items: ["Send invitations", "Start holiday shopping", "Order any specialty food items", "Plan activities/games"] },
        { id: "s3", label: "2 WEEKS BEFORE", items: ["Buy remaining gifts", "Order/pick up decorations", "Confirm final headcount", "Plan the day-of schedule"] },
        { id: "s4", label: "WEEK OF", items: ["Wrap gifts", "Grocery shop for the menu", "Put up decorations", "Prep make-ahead dishes"] },
        { id: "s5", label: "DAY OF", items: ["Finish cooking & set the table", "Set out gifts under the tree", "Welcome guests", "Enjoy the gathering!"] },
      ],
    },
    "Product Launch": {
      sections: [
        { id: "s1", label: "6 WEEKS BEFORE", items: ["Set a launch date & budget", "Finalize inventory & production", "Plan launch event/venue (if any)", "Draft press release"] },
        { id: "s2", label: "4 WEEKS BEFORE", items: ["Reach out to press & influencers", "Schedule product photography", "Build the launch landing page", "Plan email campaign"] },
        { id: "s3", label: "2 WEEKS BEFORE", items: ["Schedule social media posts", "Send press/influencer samples", "Finalize email send schedule", "Brief customer service team"] },
        { id: "s4", label: "1 WEEK BEFORE", items: ["Confirm inventory is ready to ship", "Test the website/checkout flow", "Load & schedule all social content", "Prep launch-day team roles"] },
        { id: "s5", label: "LAUNCH DAY", items: ["Publish the landing page", "Send the launch email", "Post across social channels", "Monitor orders & respond to questions"] },
      ],
    },
    "Pop-Up Shop / Market Booth": {
      sections: [
        { id: "s1", label: "6 WEEKS BEFORE", items: ["Apply for vendor permit/space", "Set a budget", "Confirm booth/table size & location", "Plan product lineup"] },
        { id: "s2", label: "4 WEEKS BEFORE", items: ["Finalize inventory & pricing", "Design signage & price tags", "Order display fixtures/props", "Set up payment processing"] },
        { id: "s3", label: "2 WEEKS BEFORE", items: ["Pack inventory & supplies", "Print signage & price tags", "Prep packaging/bags", "Plan booth layout"] },
        { id: "s4", label: "WEEK OF", items: ["Charge card reader & devices", "Confirm setup/load-in time", "Pack a booth toolkit (tape, scissors, extra cash)", "Prep social posts promoting the pop-up"] },
        { id: "s5", label: "DAY OF", items: ["Set up booth & displays", "Test payment system", "Take photos of the setup", "Track sales & restock as needed"] },
      ],
    },
    "Community Festival": {
      sections: [
        { id: "s1", label: "3 MONTHS BEFORE", items: ["Secure permits & insurance", "Set a budget", "Book the venue/space", "Book performers & entertainment"] },
        { id: "s2", label: "2 MONTHS BEFORE", items: ["Open vendor applications", "Recruit volunteers", "Arrange security/first aid", "Launch promotion (social/local media)"] },
        { id: "s3", label: "1 MONTH BEFORE", items: ["Confirm vendor list & layout", "Order signage & site materials", "Finalize entertainment schedule", "Arrange trash/cleanup services"] },
        { id: "s4", label: "2 WEEKS BEFORE", items: ["Confirm volunteer shifts & roles", "Finalize the site map & signage", "Send vendor & performer logistics info", "Confirm security & first aid staffing"] },
        { id: "s5", label: "DAY OF", items: ["Set up the site & signage", "Brief volunteers & vendors", "Run the entertainment schedule", "Coordinate cleanup at close"] },
      ],
    },
    "Religious Celebration": {
      sections: [
        { id: "s1", label: "2 MONTHS BEFORE", items: ["Confirm the date with clergy/church", "Set a budget", "Make the guest list", "Book a venue for the reception"] },
        { id: "s2", label: "1 MONTH BEFORE", items: ["Send invitations", "Plan the ceremony details with clergy", "Order the cake", "Plan the reception menu"] },
        { id: "s3", label: "2 WEEKS BEFORE", items: ["Order decorations & favors", "Confirm attire for the honoree", "Confirm final headcount", "Book a photographer/videographer"] },
        { id: "s4", label: "WEEK OF", items: ["Pick up decorations & attire", "Confirm ceremony rehearsal (if any)", "Confirm catering & vendor times", "Prep a memory book or guest sign-in"] },
        { id: "s5", label: "DAY OF", items: ["Set up the reception space", "Coordinate ceremony timing", "Capture photos", "Celebrate with family & friends"] },
      ],
    },
    "Memorial / Celebration of Life": {
      sections: [
        { id: "s1", label: "AS SOON AS POSSIBLE", items: ["Choose a date & venue", "Set a budget", "Notify family & close friends", "Reach out to potential speakers"] },
        { id: "s2", label: "1-2 WEEKS BEFORE", items: ["Plan the program/order of service", "Gather photos for a memory display", "Order flowers", "Arrange catering"] },
        { id: "s3", label: "FEW DAYS BEFORE", items: ["Print the program", "Finalize the memory/photo display", "Confirm speaker order", "Confirm catering & venue setup time"] },
        { id: "s4", label: "DAY OF", items: ["Set up the memory display & guest sign-in", "Distribute programs", "Coordinate speakers", "Welcome & support family & guests"] },
      ],
    },
    "Moving / Housewarming": {
      sections: [
        { id: "s1", label: "1 MONTH BEFORE MOVE", items: ["Set a moving budget", "Book movers or a truck", "Start decluttering & packing", "Set up mail forwarding / address changes"] },
        { id: "s2", label: "2 WEEKS BEFORE MOVE", items: ["Transfer/set up utilities at the new place", "Notify banks & subscriptions of new address", "Pack non-essentials", "Arrange cleaning for the old place"] },
        { id: "s3", label: "MOVE WEEK", items: ["Pack an essentials box", "Confirm mover/truck arrival time", "Do a final walkthrough of the old place", "Set up beds & essentials first at the new place"] },
        { id: "s4", label: "HOUSEWARMING PARTY", items: ["Pick a date once mostly unpacked", "Send invitations", "Plan a simple menu", "Tidy & set up key rooms for guests"] },
        { id: "s5", label: "DAY OF PARTY", items: ["Set out food & drinks", "Give a mini house tour", "Have a guest book or card for well wishes", "Enjoy your new home!"] },
      ],
    },
    "Vacation / Group Trip": {
      sections: [
        { id: "s1", label: "3 MONTHS BEFORE", items: ["Set a budget & collect payments (if group)", "Book flights/transportation", "Book lodging", "Check passport/ID/visa requirements"] },
        { id: "s2", label: "1 MONTH BEFORE", items: ["Plan a rough itinerary", "Book key activities/reservations", "Arrange travel insurance", "Confirm time off work"] },
        { id: "s3", label: "2 WEEKS BEFORE", items: ["Print/save confirmations & documents", "Arrange pet/house sitting", "Check weather & pack accordingly", "Notify bank of travel (if needed)"] },
        { id: "s4", label: "WEEK OF", items: ["Pack luggage", "Charge devices & pack chargers", "Confirm transportation to the airport/departure point", "Set out-of-office replies"] },
        { id: "s5", label: "DAY OF DEPARTURE", items: ["Double-check documents & tickets", "Arrive with time to spare", "Share itinerary with someone at home", "Enjoy the trip!"] },
      ],
    },
  };

  window.ProductHausEventChecklists = {
    EVENT_TYPE_OPTIONS: EVENT_TYPE_OPTIONS,
    EVENT_CHECKLIST_LIBRARY: EVENT_CHECKLIST_LIBRARY,
  };
})();
