# Sketch Theme Colors

> A quick way to see the colors used in Sketch's UI, made by [Oscar Marcelo](https://oscarmarcelo.com).



## Build

This project is built in two phases:
1. A Sketch plugin retrieves the necessary data from Sketch;
2. The website is then built with the Sketch data.


### Build Instructions

1. Just like any other Node project, run `npm install`;
2. Run `npm run get-colors` to get Sketch data. Ensure you have Sketch installed in your system installed first!
3. Run `npm start` to build the website, run a local webserver and open the page.

Alternatively, you can run `npm run build` to just build the website without starting the webserver.



## Contributing

I made this project as a side project to aid my work with the Sketch plugins I've been building on my spare time. Any contribution is very welcome!

These are some of the things I wish to work on next:

- Improve design;
- Improve code quality;
- Mount all Sketch Data at the build stage the project instead of mounting on the client-side;
- Add diff tooltips in changed cells;
- Show removed variables and properties.
- Automate the generation of the list of Sketch versions, which currently is in [`data.js`](./src/scripts/data.js);
