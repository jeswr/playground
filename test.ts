import { newEngine } from '@comunica/actor-init-sparql-rdfjs';
// @ts-ignore This has no type declarations - big sad, will create PR with my branches type declarations when I have the chance
import ComunicaEngine from '@ldflex/comunica';
// @ts-ignore Again, no type declarations.
import { PathFactory } from 'ldflex';
import { Store } from 'n3';
import { JsonLdParser } from 'jsonld-streaming-parser';
import { namedNode } from '@rdfjs/data-model'
const parserJsonld = new JsonLdParser();

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
    const store = new Store();

    await new Promise((resolve, reject) => {
        // NOTE: Store.addQuads accepts an *array of quads* as input, store.inport accepts a *stream*
        store.import(parserJsonld)
            .on('end', resolve)
            .on('error', reject);
        console.log('writing quads ...')
        parserJsonld.write(jsonLdString);
        console.log('finished writing quads\n')
        parserJsonld.end();
    })

    const queryEngine = new ComunicaEngine();
    queryEngine._engine = newEngine();
    queryEngine._sources = [store];

    const path = new PathFactory({
        context: { "@context": "https://schema.org/" },
        queryEngine,
    });

    const person = path.create({
        subject: namedNode("https://example.org/Person/JohnDoe")
    });

    console.log(`main subject name: ${await person["http://schema.org/name"]}`);
    // Because of our context we can also do this
    console.log(`main subject name using .name: ${await person.name}`);
    
    console.log('')
    
    for await (const individual of person.subjects) {
      console.log(`random subject name: ${await individual["http://schema.org/name"]}`);
    }
})();
