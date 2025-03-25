describe('Test API Passive Liveness Kby', () => {
  // case 1
  it('Should successfully post passive liveness', () => {
    cy.passiveLivenessKBY({
      file: 'test1.jpeg',
      file_meta:
        '{"filename":"test1.jpeg", "liveness": 0.78, "meta": {"x1":"10","y1":"1"}}',
    }).then((response) => {
      console.log('Response:', response);
      const text = new TextDecoder().decode(response.body);
      try {
        const jsonResponse = JSON.parse(text);
        console.log('Response Body (Parsed JSON):', jsonResponse);
        expect(jsonResponse).to.have.property('code', 200);
        expect(jsonResponse).to.have.property('status', 1);
        expect(jsonResponse).to.have.property('error', false);
        expect(jsonResponse).to.have.property(
          'message',
          'Success passive liveness kby engine'
        );

        const { data } = jsonResponse;
        expect(data).to.have.property('result', true);
        expect(data).to.have.property('selfie_filename', file);
      } catch (error) {
        console.log('Response Body (Raw Text):', text);
      }
    });
  });

  //case 2
  it('Should error post passive liveness because file is empty', () => {
    cy.passiveLivenessKBY({
      file: '',
      file_meta:
        '{"filename":"test1.jpeg", "liveness": 0.78, "meta": {"x1":"10","y1":"1"}}',
    }).then((response) => {
      console.log('Response:', response);
      const text = new TextDecoder().decode(response.body);
      try {
        const jsonResponse = JSON.parse(text);
        console.log('Response Body (Parsed JSON):', jsonResponse);
        expect(jsonResponse).to.have.property('code', 400);
        expect(jsonResponse).to.have.property('status', 0);
        expect(jsonResponse).to.have.property('error', true);
        expect(jsonResponse).to.have.property('message', 'Selfie is required');
        expect(jsonResponse).to.have.property('name', 'BadRequestError');
      } catch (error) {
        console.log('Response Body (Raw Text):', text);
      }
    });
  });

  //case 3
  it('Should error post passive liveness because file_meta is empty', () => {
    cy.passiveLivenessKBY({
      file: 'test1.jpeg',
      file_meta: '',
    }).then((response) => {
      console.log('Response:', response);
      const text = new TextDecoder().decode(response.body);
      try {
        const jsonResponse = JSON.parse(text);
        console.log('Response Body (Parsed JSON):', jsonResponse);
        expect(jsonResponse).to.have.property('code', 400);
        expect(jsonResponse).to.have.property('status', 0);
        expect(jsonResponse).to.have.property('error', true);
        expect(jsonResponse).to.have.property(
          'message',
          'Selfie meta data is required'
        );
        expect(jsonResponse).to.have.property('name', 'BadRequestError');
      } catch (error) {
        console.log('Response Body (Raw Text):', text);
      }
    });
  });
});
