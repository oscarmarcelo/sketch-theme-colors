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
- Add diff tooltips in changed cells;
- Show removed variables and properties;
- Automate repo updates through GitHub Actions;
  - Gather new data as soon as a new Sketch update releases;
- Fix content not respecting search filter when one of the other filters changes.
- Migrate to Node ESM when Gulp adds support for it:
  - [Issue regarding Gulp not supporting Node's ESM](https://github.com/gulpjs/gulp/issues/2417)
  - [Migration Guide](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c#how-can-i-move-my-commonjs-project-to-esm)
