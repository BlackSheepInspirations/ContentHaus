/**
 * The AI Creator's Product Haus — Event Vendor Checklist content library
 * Pure data, no dependencies. Loaded before
 * product-haus-generators-vendorchecklist.js.
 *
 * A single fixed vendor-category list (not keyed by event type — this
 * tool works across any event), consumed by product-haus-generators.js's
 * Checklist Items capability via staticChecklistSections. Each item is
 * shaped as a tracking row (name/contact/quote/deposit/balance-due
 * blanks), not a plain action item — the checkbox itself reads as
 * "vendor secured" once the row is filled in.
 */
(function () {
  "use strict";

  var VENDOR_CHECKLIST_SECTIONS = [
    {
      id: "key",
      label: "KEY VENDORS",
      items: [
        "Venue — Name: ____________ | Contact: ____________ | Quote: $______ | Deposit Paid: Y/N | Balance Due: $______ by ______",
        "Catering — Name: ____________ | Contact: ____________ | Quote: $______ | Deposit Paid: Y/N | Balance Due: $______ by ______",
        "Photography — Name: ____________ | Contact: ____________ | Quote: $______ | Deposit Paid: Y/N | Balance Due: $______ by ______",
        "Videography — Name: ____________ | Contact: ____________ | Quote: $______ | Deposit Paid: Y/N | Balance Due: $______ by ______",
      ],
    },
    {
      id: "creative",
      label: "CREATIVE & STYLING",
      items: [
        "Florist — Name: ____________ | Contact: ____________ | Quote: $______ | Deposit Paid: Y/N | Balance Due: $______ by ______",
        "Hair & Makeup — Name: ____________ | Contact: ____________ | Quote: $______ | Deposit Paid: Y/N | Balance Due: $______ by ______",
        "Stationery / Invitations — Name: ____________ | Contact: ____________ | Quote: $______ | Deposit Paid: Y/N | Balance Due: $______ by ______",
        "Cake & Desserts — Name: ____________ | Contact: ____________ | Quote: $______ | Deposit Paid: Y/N | Balance Due: $______ by ______",
      ],
    },
    {
      id: "logistics",
      label: "LOGISTICS & ENTERTAINMENT",
      items: [
        "DJ / Band / Entertainment — Name: ____________ | Contact: ____________ | Quote: $______ | Deposit Paid: Y/N | Balance Due: $______ by ______",
        "Officiant / Host — Name: ____________ | Contact: ____________ | Quote: $______ | Deposit Paid: Y/N | Balance Due: $______ by ______",
        "Rentals (tables, chairs, linens) — Name: ____________ | Contact: ____________ | Quote: $______ | Deposit Paid: Y/N | Balance Due: $______ by ______",
        "Transportation — Name: ____________ | Contact: ____________ | Quote: $______ | Deposit Paid: Y/N | Balance Due: $______ by ______",
      ],
    },
  ];

  window.ProductHausVendorChecklist = {
    VENDOR_CHECKLIST_SECTIONS: VENDOR_CHECKLIST_SECTIONS,
  };
})();
