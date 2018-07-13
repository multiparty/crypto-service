import { umbral } from '../src/umbral';
import { expect } from 'chai';
import { OPRF } from 'oprf';
var _sodium = require('libsodium-wrappers');

function hashId(id: string): Uint8Array {
  return (_sodium.crypto_hash(id)).slice(0, 32);
}

function getRandom(max: number): number {
  return Math.floor(Math.random() * Math.floor(max));
}

function createName(): string {
  
  const alphabet: string[] = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
                              "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
  let name: string = "";
  for (let i: number = 0; i < getRandom(128); i++) {
      const index: number = getRandom(alphabet.length);
      name += alphabet[index];
    }

  if (name === "") {
      name = "XXXXXX";
    }
  return name;
}

describe('End-to-end tests', () => {
  
  it('basic example', async function() {
    await _sodium.ready;
    const _umbral = new umbral(_sodium);

    const ocKeyPair = _sodium.crypto_box_keypair();
    const userKeyPair = _sodium.crypto_box_keypair();

    const perpId = createName();
    let userId = createName();
    const randId: Uint8Array = hashId(perpId);

    const encryptedDataA = _umbral.encryptData(randId, { perpId, userId }, [ocKeyPair.publicKey], userKeyPair.privateKey);
    userId = userId + userId;
    const encryptedDataB = _umbral.encryptData(randId, { perpId, userId }, [ocKeyPair.publicKey], userKeyPair.privateKey);
    const decryptedRecords = _umbral.decryptData([encryptedDataA[0], encryptedDataB[0]], ocKeyPair.privateKey, [userKeyPair.publicKey, userKeyPair.publicKey]);
    expect(decryptedRecords[0].perpId).to.equal(decryptedRecords[1].perpId).to.equal(perpId);
  });

  it('basic example', async function() {
    await _sodium.ready;
    const _umbral = new umbral(_sodium);
    const oprf = new OPRF(_sodium);

    const ocKeyPair = _sodium.crypto_box_keypair();
    const userKeyPair = _sodium.crypto_box_keypair();

    const perpId = createName();
    let userId = createName();
    const randId: Uint8Array = hashId(perpId);

    const encryptedDataA = _umbral.encryptData(randId, { perpId, userId }, [ocKeyPair.publicKey], userKeyPair.privateKey);
    userId = userId + userId;
    const encryptedDataB = _umbral.encryptData(randId, { perpId, userId }, [ocKeyPair.publicKey], userKeyPair.privateKey);
    const decryptedRecords = _umbral.decryptData([encryptedDataA[0], encryptedDataB[0]], ocKeyPair.privateKey, [userKeyPair.publicKey, userKeyPair.publicKey]);
    // expect(decryptedRecords[0].perpId).to.equal(decryptedRecords[1].perpId).to.equal(perpId);
  });

  it('basic example with 3 matches', async function() {
    await _sodium.ready;
    const _umbral = new umbral(_sodium);

    const ocKeyPair = _sodium.crypto_box_keypair();
    const userKeyPairA = _sodium.crypto_box_keypair();
    const userKeyPairB = _sodium.crypto_box_keypair();
    const userKeyPairC = _sodium.crypto_box_keypair();

    const perpId = createName();
    let userId = createName();
    const randId: Uint8Array = hashId(perpId);

    const encryptedDataA = _umbral.encryptData(randId, { perpId, userId }, [ocKeyPair.publicKey], userKeyPairA.privateKey);    
    userId = userId + userId;
    const encryptedDataB = _umbral.encryptData(randId, { perpId, userId }, [ocKeyPair.publicKey], userKeyPairB.privateKey);
    userId = userId + userId;
    const encryptedDataC = _umbral.encryptData(randId, { perpId, userId }, [ocKeyPair.publicKey], userKeyPairC.privateKey);

    const decryptedRecords = _umbral.decryptData([encryptedDataA[0], encryptedDataB[0], encryptedDataC[0]], ocKeyPair.privateKey, [userKeyPairA.publicKey, userKeyPairB.publicKey, userKeyPairC.publicKey]);
    expect(decryptedRecords[0].perpId).to.equal(decryptedRecords[1].perpId).to.equal(perpId);
  });
    
  it('stress test', async function() {
    await _sodium.ready;
    const _umbral = new umbral(_sodium);

    const ocKeyPair = _sodium.crypto_box_keypair();
    const userKeyPair = _sodium.crypto_box_keypair();

    const testNum: number = 100;
    for (let i: number = 0; i < testNum; i++) {
      const perpId: string = createName();
      const randId: Uint8Array = hashId(perpId);
      let userId: string = createName();

      const encryptedDataA = _umbral.encryptData(randId, { perpId, userId }, [ocKeyPair.publicKey], userKeyPair.privateKey);

      userId = userId + userId;
      const encryptedDataB = _umbral.encryptData(randId, { perpId, userId}, [ocKeyPair.publicKey], userKeyPair.privateKey);
    
      const decryptedRecords = _umbral.decryptData([encryptedDataA[0], encryptedDataB[0]], ocKeyPair.privateKey, [userKeyPair.publicKey, userKeyPair.publicKey]);

      expect(decryptedRecords[0].perpId).to.equal(decryptedRecords[1].perpId).to.equal(perpId);
    }
  });

  it('multiple OCs', async function() {
    await _sodium.ready;
    const _umbral = new umbral(_sodium);

    const ocNum = 5;
    let ocPubKeys = [];
    let ocPrivKeys = [];

    for (var i = 0; i < ocNum; i++) {
      let key = _sodium.crypto_box_keypair();

      ocPubKeys.push(key.publicKey);
      ocPrivKeys.push(key.privateKey);
    }

    const userKeyPair = _sodium.crypto_box_keypair();

    const perpId: string = createName();
    const randId: Uint8Array = hashId(perpId);
    let userId: string = createName();

    const encryptedDataA = _umbral.encryptData(randId, { perpId, userId }, ocPubKeys, userKeyPair.privateKey);
    userId = userId + userId;
    const encryptedDataB = _umbral.encryptData(randId, { perpId, userId }, ocPubKeys, userKeyPair.privateKey);


    for (var i = 0; i < ocNum; i++) {
      const decryptedRecords = _umbral.decryptData([encryptedDataA[i], encryptedDataB[i]], ocPrivKeys[i], [userKeyPair.publicKey, userKeyPair.publicKey]);
      expect(decryptedRecords[0].perpId).to.equal(decryptedRecords[1].perpId).to.equal(perpId);
    }
  });


  it('multiple perpIds', async function() {
    await _sodium.ready;
    const _umbral = new umbral(_sodium);

    const perpIds: string[] = ['twitter', 'linkedin', 'facebook'];
    let userId: string = createName();

    const ocKeyPair = _sodium.crypto_box_keypair();
    const userKeyPair = _sodium.crypto_box_keypair();

    for (var i = 0; i < perpIds.length; i++) {
      let perpId = perpIds[i];
      const randId: Uint8Array = hashId(perpId);
      
      const encryptedDataA = _umbral.encryptData(randId, { perpId, userId }, [ocKeyPair.publicKey], userKeyPair.privateKey);
      userId = userId + userId;
      const encryptedDataB = _umbral.encryptData(randId, { perpId, userId }, [ocKeyPair.publicKey], userKeyPair.privateKey);
      const decryptedRecords = _umbral.decryptData([encryptedDataA[0], encryptedDataB[0]], ocKeyPair.privateKey, [userKeyPair.publicKey, userKeyPair.publicKey]);

      expect(decryptedRecords[0].perpId).to.equal(decryptedRecords[1].perpId).to.equal(perpId);
    }
  });

  it('multiple perpIds and multiple OCs', async function() {
    await _sodium.ready;
    const _umbral = new umbral(_sodium);

    const ocNum = 5;
    let ocPubKeys = [];
    let ocPrivKeys = [];

    for (var i = 0; i < ocNum; i++) {
      let key = _sodium.crypto_box_keypair();

      ocPubKeys.push(key.publicKey);
      ocPrivKeys.push(key.privateKey);
    }
    
    const userKeyPair = _sodium.crypto_box_keypair();

    for (var i = 0; i < ocNum; i++) {

      let perpId: string = createName()
      const randId: Uint8Array = hashId(perpId);
      let userId: string = createName();

      let encryptedDataA = _umbral.encryptData(randId, { perpId, userId }, ocPubKeys, userKeyPair.privateKey);
      userId = userId + userId;
      let encryptedDataB = _umbral.encryptData(randId, { perpId, userId }, ocPubKeys, userKeyPair.privateKey);


      for (var j = 0; j < ocNum; j++) {
        let decryptedRecords = _umbral.decryptData([encryptedDataA[i], encryptedDataB[i]], ocPrivKeys[i], [userKeyPair.publicKey, userKeyPair.publicKey]);
        expect(decryptedRecords[0].perpId).to.equal(decryptedRecords[1].perpId).to.equal(perpId);
      }
    }
  });
});

describe('Error cases', () => {
  it('Did not provide OC public key', async function() {
    await _sodium.ready;
    const _umbral = new umbral(_sodium);

    const userKeyPair = _sodium.crypto_box_keypair();

    const perpId = createName();
    let userId = createName();
    const randId: Uint8Array = hashId(perpId);
    expect(() => _umbral.encryptData(randId, {perpId, userId}, [], userKeyPair.privateKey))
                        .to.throw('No OC public key provided');

  });

  it('Incorrect number of user public keys', async function() {
    await _sodium.ready;
    const _umbral = new umbral(_sodium);

    const ocKeyPair = _sodium.crypto_box_keypair();
    const userKeyPair = _sodium.crypto_box_keypair();

    const perpId = createName();
    let userId = createName();
    const randId: Uint8Array = hashId(perpId);

    const encryptedDataA = _umbral.encryptData(randId, { perpId, userId }, [ocKeyPair.publicKey], userKeyPair.privateKey);
    userId = userId + userId;
    const encryptedDataB = _umbral.encryptData(randId, { perpId, userId }, [ocKeyPair.publicKey], userKeyPair.privateKey);
  
    expect(() => _umbral.decryptData([encryptedDataA[0], encryptedDataB[0]], ocKeyPair.privateKey, [userKeyPair.publicKey]))
                        .to.throw('Number of matches does not equal number of public keys for users');
  });

  it('Too few matches provided', async function() {
    await _sodium.ready;
    const _umbral = new umbral(_sodium);

    const ocKeyPair = _sodium.crypto_box_keypair();
    const userKeyPair = _sodium.crypto_box_keypair();

    const perpId = createName();
    let userId = createName();
    const randId: Uint8Array = hashId(perpId);

    const encryptedDataA = _umbral.encryptData(randId, { perpId, userId }, [ocKeyPair.publicKey], userKeyPair.privateKey);
    
    expect(() => _umbral.decryptData([encryptedDataA[0]], ocKeyPair.privateKey, [userKeyPair.publicKey]))
                        .to.throw('Not enough matches');
  }); 

  it('Incorrect number of user public keys', async function() {
    await _sodium.ready;
    const _umbral = new umbral(_sodium);

    const ocKeyPair = _sodium.crypto_box_keypair();
    const userKeyPair = _sodium.crypto_box_keypair();

    const perpId = createName();
    let userId = createName();
    const randIdA: Uint8Array = hashId(perpId);
    const randIdB: Uint8Array = hashId(perpId + perpId);


    const encryptedDataA = _umbral.encryptData(randIdA, { perpId, userId }, [ocKeyPair.publicKey], userKeyPair.privateKey);
    userId = userId + userId;
    const encryptedDataB = _umbral.encryptData(randIdB, { perpId, userId }, [ocKeyPair.publicKey], userKeyPair.privateKey);
  
    expect(() => _umbral.decryptData([encryptedDataA[0], encryptedDataB[0]], ocKeyPair.privateKey, [userKeyPair.publicKey, userKeyPair.publicKey]))
                        .to.throw('Incorrect match found');
  });
});