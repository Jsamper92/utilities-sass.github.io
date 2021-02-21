#!/usr/bin/env node
const [fs, utils] = [require("fs"), require("./.frontech/utils")];
let indexItems = 0;
const pathSettings = `${__dirname}/library/web`;
const pathBuild = process.cwd();
const fileConfig = process.argv.filter((file) =>
  /.frontech.json/.test(file) ? file : null
);
const data = JSON.parse(
  fs.readFileSync(`${process.cwd()}/${fileConfig}`).toString()
);
const StyleDictionary = require("style-dictionary").extend({
  source: [".frontech.json"],
  platforms: {
    scss: {
      transformGroup: "scss",
      buildPath: `${__dirname}/library/web/`,
      files: [
        {
          destination: "settings/_colors.scss",
          format: "custom/properties-color",
          filter: {
            type: "color"
          },
        },
        {
          destination: "settings/_breakpoints.scss",
          format: "custom/breakpoints",
          filter: {
            type: "grid"
          }
        },
        {
          destination: "settings/_media-queries.scss",
          format: "custom/mediaqueries",
          filter: {
            type: "grid"
          }
        },
        {
          destination: "settings/_spacing.scss",
          format: "custom/spacing",
          filter: {
            type: "spacing"
          }
        }
      ]
    },
    android: {
      transformGroup: "android",
      buildPath: `${__dirname}/library/android/`,
      files: [
        {
          destination: "tokens.colors.xml",
          format: "android/colors"
        }
      ]
    },
    ios: {
      transformGroup: "ios",
      buildPath: `${__dirname}/library/ios/`,
      files: [
        {
          destination: "tokens.h",
          format: "ios/macros"
        }
      ]
    }
  }
});

StyleDictionary.registerFormat({
  name: "custom/breakpoints",
  formatter: (dictionary) => {
    let result = [];
    for (const key in dictionary.properties.breakpoints) {
      let value = dictionary.properties.breakpoints[key];
      layout = value.gutter.attributes.type;
      const [gutter, offset, columns, width] = [
        value.gutter,
        value.offset,
        value.columns,
        value.width
      ];
      result += `${layout}:(
          ${gutter.path[2]}:${gutter.value},
          ${offset.path[2]}:${offset.value},
          ${columns.path[2]}:${columns.value},
          ${width.path[2]}:${width.value}
        ),`;
    }

    return `/// Mapa creado dinamicamente en base al fichero de configuración. Define los puntos de ruptura de los distintos breakpoints\n/// @type map\n/// @group grid \n$breakpoints: (
              ${result}
          );`;
  }
});
StyleDictionary.registerFormat({
  name: "custom/mediaqueries",
  formatter: (dictionary) => {
    let result = [];
    for (const key in dictionary.properties.breakpoints) {
      let value = dictionary.properties.breakpoints[key];
      layout = value.gutter.attributes.type;
      const [width] = [value.width];
      result += `/// Mixin cuyo objetivo es crear la media-query en base a los puntos de corte establecidos en el fichero de configuración\n///\n///\n/// @example scss\n///\n///      .test{\n///         width: 100%;\n///         @include screen-${key}(){\n///           width: auto;\n///         }\n///      }\n///\n/// @example css\n///\n///      .test {\n///         width: 100%;\n///       }\n///\n///      @media only screen and (min-width: ${width}) {\n///         .test {\n///           width: auto;\n///         }\n///      }\n///\n/// @group media-queries \n@mixin screen-${key}{
            @media only screen and (min-width: ${width}) {
              @content
            }
          };\n`;
    }

    return result;
  }
});
StyleDictionary.registerFormat({
  name: "custom/spacing",
  formatter: (dictionary) => {
    const { increase, limit } = dictionary.properties.spacing;

    return `/// Mapa creado dinamicamente en base al fichero de configuración. Define los atributos para crear las clases de utilidad de margin y padding\n/// @type number\n/// @group spacing
      $spacing: (
          increase:${increase.value},
          limit:${limit.value}
      );
    `;
  }
});
StyleDictionary.registerFormat({
  name: "custom/properties-color",
  formatter: (dictionary) => {
    let key = Object.keys(dictionary.properties.colors);
    let customProperties = '\n';
    key.forEach(item => {
      value = dictionary.properties.colors[item];
      customProperties+= `--${item}:${value.value};\n`
    })
    return `/// Variables de color definida en el archivo .frontech.json\n///@group colors\n:root{${customProperties}};`;
  }
});

utils.printMessage("Proceso de creación de settings iniciado");

utils.warningConsole(
  `En base a la información aportada en el fichero de configuración ${fileConfig} se procede a generar los siguientes archivos: \n`
);

StyleDictionary.buildAllPlatforms();
let partials = "";
for (const key in data) {
  indexItems++;
  partials += `@forward '${key}';\n`;
}

if (Object.keys(data).length == indexItems) {
  utils.createFile(`${pathSettings}/settings`, "settings.scss", `@forward 'general';\n${partials}`);
}

utils.printMessage("Proceso de creación de settings finalizado");
