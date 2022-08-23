# Architecture Decisions Record

## 1. Document `method` field logic

Add method field to documents. (avoid create for non-anchor programs)

Note: Creating Mint, Tokens and AssociatedToken accounts is possible using Anchor directly, the problem here is that they need some additional fields in order to work. We have a few options:

1. Adding conditional fields to the documents form: This is by far the easiest solution at the moment, the problem arises when there are more plugins. The form will get more and more complex with time.
2. Create a different form per collection: This is still an easy solution and it's the behavior from the current state of Bulldozer. Just like with Bulldozer, this introduces fragmentation between the plugins and the actual forms.
3. Plugins define document/task forms making them specific: This gives us a lot of flexibility, since we can make custom forms that behave specifically given the case. The problem is that Plugins become more complex and harder to maintain.
4. Don't use Anchor macros for creating such accounts, instead always use UncheckedAccount and create the account and initialize it in the handler instead.: This is probably the simplest solution of all, but the user pays the price. Instead of using the collections for create methods, they have to use Unchecked and use createAccount + initialize the account accordingly. Making it way more complex for creation.

### Final decision

The option #1 is terrible in terms of maintainance, #2 is a bit better but it still requires extra maintainance, #3 is the best option so far but it makes Plugins more complex and less re-usable (Crane). So far, the best option seems to be #4.

Additionally, we're working on a data structure that we can use to generate the programs. It's possible to have multiple generators, so it's fair to assume that it's the generator's responsibility to decide which code will be generated on the end.

### Implementation details

Documents have a method that can be:

- Create: A new account is created.
- Update: The changes made to the account are persisted.
- Delete: The account is deleted.
- Read: Gives the instruction access to an account's data.

Not all documents have a create method, there are plugins to use native Solana programs, when creating accounts for these programs, we need additional info or they error out, i.e. a Token account needs a Mint and an Authority. This kind of collections can't use the same "create" flow.

This solution still feels hack-y.

- How can we tell which plugins work and which doesn't?
- Should we differentiate between anchor and native plugins?
- native plugins are the ones that can't use create for documents?

## 2. Document `seed` field logic

The seeds of a document can be a number things... It can take unsigned integers (u8, u16, u32 and u64), it can be a value (AKA a const) or a reference. Reference value's can come from the instruction's arguments or from a document's collection attribute. The generator is responsible of properly encoding that into Rust-anchor compatible code. It should be possible to organize the seeds using drag and drop.

The seed also has a bump. The bump is way more rigid, it can be `null` meaning that anchor has to calculate it (this is considered unsafe unless you're creating a new account), it can be value (u8) or a reference (to an instruction's argument of type u8 or a document's collection attribute of type u8).

### Implementation details

For the seed, it seems like the best option would be to have a list of the seeds, with a drag handle and a button to delete. At the end of the list is an input with a plus button, the input is powered by an autocomplete that aggregates all the options and presents them in a user-friendly way.

If an attribute or argument changes the name/type the change has to be reflected. This means that seeds can't be plain strings but rather ID references, except for constants.

What happens when a seed is a constant?

Constants can be of any type like attributes/arguments, the type is chosen during creation.

Seeds are displayed as a plain string but we store some information:

```typescript
type ArgumentSeed = {
  kind: 'argument';
  argumentId: string;
};

type AttributeSeed = {
  kind: 'attribute';
  documentId: string;
  attributeId: string;
};

type ValueSeed = {
  kind: null;
  type: string;
  value: string;
};

type SeedTypes = ArgumentSeed | AttributeSeed | ValueSeed;
```

For the bump we have a select with all the u8-typed options.
