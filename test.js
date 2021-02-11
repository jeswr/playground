"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const actor_init_sparql_rdfjs_1 = require("@comunica/actor-init-sparql-rdfjs");
// @ts-ignore This has no type declarations - big sad, will create PR with my branches type declarations when I have the chance
const comunica_1 = __importDefault(require("@ldflex/comunica"));
// @ts-ignore Again, no type declarations.
const ldflex_1 = require("ldflex");
const n3_1 = require("n3");
const jsonld_streaming_parser_1 = require("jsonld-streaming-parser");
const data_model_1 = require("@rdfjs/data-model");
const parserJsonld = new jsonld_streaming_parser_1.JsonLdParser();
const jsonLdString = `{
  "@context": "http://schema.org/",
  "@graph": [{
    "@id": "https://example.org/Person/JaneDoe",
    "@type": "Person",
    "name": "Jane Doe",
    "jobTitle": "Professor",
    "telephone": "(425) 123-4567",
    "url": "http://www.janedoe.com"
  },{
    "@id": "https://example.org/Person/JohnDoe",
    "@type": "Person",
    "name": "John Doe",
    "jobTitle": "Professor",
    "telephone": "(425) 234-5678",
    "url": "http://www.johndoe.com"
  }]
}`;
(async () => {
    const store = new n3_1.Store();
    await new Promise((resolve, reject) => {
        // NOTE: Store.addQuads accepts an *array of quads* as input, store.inport accepts a *stream*
        store.import(parserJsonld)
            .on('end', resolve)
            .on('error', reject);
        console.log('writing quads ...');
        parserJsonld.write(jsonLdString);
        console.log('finished writing quads\n');
        parserJsonld.end();
    });
    const queryEngine = new comunica_1.default();
    queryEngine._engine = actor_init_sparql_rdfjs_1.newEngine();
    queryEngine._sources = [store];
    const path = new ldflex_1.PathFactory({
        context: { "@context": "https://schema.org/" },
        queryEngine,
    });
    const person = path.create({
        subject: data_model_1.namedNode("https://example.org/Person/JohnDoe")
    });
    console.log(`main subject name: ${await person["http://schema.org/name"]}`);
    console.log('');
    for await (const individual of person.subjects) {
        console.log(`random subject name: ${await individual["http://schema.org/name"]}`);
    }
})();
