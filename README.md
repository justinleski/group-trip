# group-trip
### Purpose
This is a finance-splitting app. After travelling to Iceland with friends last Summer, coming back, I had a major problem. We had to sit on a spreadsheet with our notes app and receipts to figure who owes who. This took quite a bit a of work thus inspiring me to make GroupTrip.

### Demo
![Demo](public/groupTripDemo2.gif) <br>

> [!IMPORTANT]  
> Due to the project being hosted on Supabase, the project can "wound down." If the demo is not functional it is due to this, not error in the code.

A live demo can be found [here on Render](https://group-trip.onrender.com/). The DB is hosted on Supabase.

### Challenges Faced
#### Routers and Controllers
- This was by far the most complex app I've done. While I didn't understand why frameworks like React have gained a lot of traction, working with MVC and EJS has given me an understanding of why many devs opt for Client-side rendering.
- My app is not the best organized in all honesty; but I think it given me an understanding of the purpose of routing and I can see mistakes on both ends of the spectrum.
    - I created too many routes for the sign in/out/up flow were not necessary.
    - Contrarily, I created too little routes for the trip overview and planning page. This has made the router and controller for the tripOverview much more cluttered than they need to be.

#### UI
- I realized that working with MVC made me think a little more on what needs to be a new page. With React being built out of components on a typically single-view app, it was a bit jarring to have to make so many views which made organizing the page structure difficult.

#### EJS
- Going back SSR vs CSR, I think I have learned I have a strong preference for SSR due to how compact it is.
    - Visually, navigating through multiple views on EJS and determining how to pass variables to each view consumed a lot of mental bandwidth.

#### Express
- Express apparently will look at numeric keys passed in and assume it is an array. Due to me using autoincrement for user IDs, if we had `UID = 1` and `UID = 2` sharing a transaction, if `1` paid for both themselves and user `2`, it would show user `1` as having to pay meanwhile the owing would be assigned to another non-existant user.
    - To fix this, on the front-end, I had to append the character `u` to the form field so when `owes` was parsed it parsed it as an object allowing me to properly index in to the according owing (after stripping the `u` in the controller).

### Future Improvements
- If I were to improve the structure of this codebase, I'd honestly go for a framework like React. Despite the bulk it may carry in terms of render times, I think it is worth it. But maybe I speak too much as a dev here.
- I would organize the flow a bit better of the app, perhaps expand on the friends feature as my DB has a friends table. But maybe also keeping them in the trip suffices?
