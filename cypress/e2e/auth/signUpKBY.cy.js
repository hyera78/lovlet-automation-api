describe('API testing Sign Up KBY', () => {
  let registeredEmail;

  //case 1
  it('Sign Up with valid data using mail.gw', () => {
    const testData = {
      username: 'dummyTest',
      files: 'test1.jpeg',
      files_meta: '[{"filename":"test1.jpeg","order":0}]',
      dob: '2001-04-11',
      is_show_gender: '0',
      selfie_filename:
        'selfie/052019512329ac39e7f53999bd7956831724147883682.png',
      gender: '1',
      device_id: 'postman_localhost',
      join_location: 'jakarta',
    };

    const platform = 'ios';

    cy.generateRandomMailGwEmail().then((email) => {
      const userEmail = email;
      registeredEmail = userEmail;
      cy.log(`Generated Email: ${userEmail}`);

      cy.createMailGwAccount(userEmail).then((response) => {
        if (response.status === 201) {
          cy.log('Mail.gw account created successfully');
        } else if (response.status === 422) {
          cy.log('Account may already exist, attempting to continue');
        } else {
          expect(response.status).to.be.oneOf([201, 422]);
        }

        cy.generateRandomFCMToken().then((fcmToken) => {
          cy.log(`Generated FCM Token: ${fcmToken}`);

          cy.sendOTP({
            email: userEmail,
            device_id: testData.device_id,
            fcm_token: fcmToken,
            platform,
          }).then((response) => {
            expect(response.status).to.eq(200);

            // Wait for the email to arrive
            cy.wait(15000); // Increased wait time for email to arrive

            // Get OTP from mail.gw
            cy.getLatestOTPFromMailGw(userEmail).then(() => {
              cy.get('@otpCode').then((otp) => {
                cy.log(`OTP: ${otp}`);

                cy.verifyOTP({
                  email: userEmail,
                  otp,
                  device_id: testData.device_id,
                  fcm_token: fcmToken,
                  platform,
                }).then((response) => {
                  expect(response.body).to.have.property('code').to.equal(200);

                  const signupData = {
                    email: userEmail,
                    fcm_token: fcmToken,
                    ...testData,
                  };

                  cy.signUp(signupData).then((response) => {
                    const text = new TextDecoder().decode(response.body);
                    try {
                      const jsonResponse = JSON.parse(text);
                      console.log('Response Body (Parsed JSON):', jsonResponse);

                      expect(jsonResponse).to.have.property('code', 200);
                      expect(jsonResponse).to.have.property('status', 1);
                      expect(jsonResponse).to.have.property('error', false);
                      expect(jsonResponse).to.have.property(
                        'message',
                        'Success kby signup'
                      );

                      const { data } = jsonResponse.data;

                      expect(data).to.have.property('dob').to.be.a('string');
                      expect(data).to.have.property('email').to.be.a('string');
                      expect(data).to.have.property('gender').to.be.a('number');
                      expect(data).to.have.property('id').to.be.a('string');
                      expect(data)
                        .to.have.property('is_verified')
                        .to.be.a('boolean');
                      expect(data)
                        .to.have.property('join_location')
                        .to.be.a('string');
                      expect(data)
                        .to.have.property('username')
                        .to.be.a('string');

                      const { photo_profile } = data.photo_profile;
                      expect(photo_profile).to.be.an('array').that.is.not.empty;

                      data.forEach((item, index) => {
                        expect(item)
                          .to.have.property('mimetype')
                          .to.be.a('string');
                        expect(item).to.have.property('name').to.be.a('string');
                        expect(item)
                          .to.have.property('order')
                          .to.be.a('number')
                          .to.equal(index);
                        expect(item)
                          .to.have.property('originalname')
                          .to.be.a('string');
                        expect(item)
                          .to.have.property('similarity')
                          .to.be.a('number');
                        expect(item).to.have.property('size').to.be.a('number');
                        expect(item).to.have.property('url').to.be.a('string');
                        expect(item)
                          .to.have.property('verified')
                          .to.be.a('boolean');
                      });

                      const { profile_settings } = data.profile_settings;
                      expect(profile_settings)
                        .to.have.property('is_receive_newsletter_email')
                        .to.be.a('boolean');
                      expect(profile_settings)
                        .to.have.property('is_receive_push_notification')
                        .to.be.a('boolean');
                      expect(profile_settings)
                        .to.have.property('is_show_gender')
                        .to.be.a('boolean');
                    } catch (error) {
                      console.log('Response Body (Raw Text):', text);
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  //case 2
  it('Sign Up with email that has already been registered', () => {
    const testData = {
      username: 'dummyTest',
      files: 'test1.jpeg',
      files_meta: '[{"filename":"test1.jpeg","order":0}]',
      dob: '2001-04-11',
      is_show_gender: '0',
      selfie_filename:
        'selfie/052019512329ac39e7f53999bd7956831724147883682.png',
      gender: '1',
      device_id: 'postman_localhost',
      join_location: 'jakarta',
    };

    const platform = 'ios';

    cy.log(`Using previously registered email: ${registeredEmail}`);

    cy.createMailGwAccount(registeredEmail).then((response) => {
      expect(response.status).to.eq(422);
      cy.log('Mail.gw account already exists as expected');

      cy.generateRandomFCMToken().then((fcmToken) => {
        cy.log(`Generated FCM Token: ${fcmToken}`);

        cy.sendOTP({
          email: registeredEmail,
          device_id: testData.device_id,
          fcm_token: fcmToken,
          platform,
        }).then((response) => {
          expect(response.status).to.eq(200);

          cy.wait(15000);

          cy.getLatestOTPFromMailGw(registeredEmail).then(() => {
            cy.get('@otpCode').then((otp) => {
              cy.log(`OTP: ${otp}`);

              cy.verifyOTP({
                email: registeredEmail,
                otp,
                device_id: testData.device_id,
                fcm_token: fcmToken,
                platform,
              }).then((response) => {
                expect(response.body).to.have.property('code').to.equal(200);

                const signupData = {
                  email: registeredEmail,
                  fcm_token: fcmToken,
                  ...testData,
                };

                cy.signUp(signupData).then((response) => {
                  const text = new TextDecoder().decode(response.body);
                  try {
                    const jsonResponse = JSON.parse(text);
                    console.log('Response Body (Parsed JSON):', jsonResponse);

                    expect(jsonResponse).to.have.property('code', 400);
                    expect(jsonResponse).to.have.property('data').to.be.null;
                    expect(jsonResponse).to.have.property('error', true);
                    expect(jsonResponse).to.have.property(
                      'message',
                      'Account already exist or is in 30 days retention period'
                    );
                    expect(jsonResponse).to.have.property(
                      'name',
                      'BadRequestError'
                    );
                    expect(jsonResponse).to.have.property('status', 0);
                  } catch (error) {
                    console.log('Response Body (Raw Text):', text);
                  }
                });
              });
            });
          });
        });
      });
    });
  });

  //case 3
  it('Sign Up with blank username', () => {
    const testData = {
      username: '',
      files: 'test1.jpeg',
      files_meta: '[{"filename":"test1.jpeg","order":0}]',
      dob: '2001-04-11',
      is_show_gender: '0',
      selfie_filename:
        'selfie/052019512329ac39e7f53999bd7956831724147883682.png',
      gender: '1',
      device_id: 'postman_localhost',
      join_location: 'jakarta',
    };

    const platform = 'ios';

    cy.generateRandomMailGwEmail().then((email) => {
      const userEmail = email;
      registeredEmail = userEmail;
      cy.log(`Generated Email: ${userEmail}`);

      cy.createMailGwAccount(userEmail).then((response) => {
        if (response.status === 201) {
          cy.log('Mail.gw account created successfully');
        } else if (response.status === 422) {
          cy.log('Account may already exist, attempting to continue');
        } else {
          expect(response.status).to.be.oneOf([201, 422]);
        }

        cy.generateRandomFCMToken().then((fcmToken) => {
          cy.log(`Generated FCM Token: ${fcmToken}`);

          cy.sendOTP({
            email: userEmail,
            device_id: testData.device_id,
            fcm_token: fcmToken,
            platform,
          }).then((response) => {
            expect(response.status).to.eq(200);

            // Wait for the email to arrive
            cy.wait(15000); // Increased wait time for email to arrive

            // Get OTP from mail.gw
            cy.getLatestOTPFromMailGw(userEmail).then(() => {
              cy.get('@otpCode').then((otp) => {
                cy.log(`OTP: ${otp}`);

                cy.verifyOTP({
                  email: userEmail,
                  otp,
                  device_id: testData.device_id,
                  fcm_token: fcmToken,
                  platform,
                }).then((response) => {
                  expect(response.body).to.have.property('code').to.equal(200);

                  const signupData = {
                    email: userEmail,
                    fcm_token: fcmToken,
                    ...testData,
                  };

                  cy.signUp(signupData).then((response) => {
                    const text = new TextDecoder().decode(response.body);
                    try {
                      const jsonResponse = JSON.parse(text);
                      console.log('Response Body (Parsed JSON):', jsonResponse);

                      expect(jsonResponse).to.have.property('code', 400);
                      expect(jsonResponse).to.have.property('data').to.be.null;
                      expect(jsonResponse).to.have.property('error', true);
                      expect(jsonResponse).to.have.property(
                        'message',
                        'Email and username required'
                      );
                      expect(jsonResponse).to.have.property(
                        'name',
                        'BadRequestError'
                      );
                      expect(jsonResponse).to.have.property('status', 0);
                    } catch (error) {
                      console.log('Response Body (Raw Text):', text);
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  //case 4
  it('Sign Up with blank files', () => {
    const testData = {
      username: 'dummyTest',
      files: '', // Keep this as an empty string
      files_meta: '[{"filename":"test1.jpeg","order":0}]',
      dob: '2001-04-11',
      is_show_gender: '0',
      selfie_filename:
        'selfie/052019512329ac39e7f53999bd7956831724147883682.png',
      gender: '1',
      device_id: 'postman_localhost',
      join_location: 'jakarta',
    };

    const platform = 'ios';

    cy.generateRandomMailGwEmail().then((email) => {
      const userEmail = email;
      registeredEmail = userEmail;
      cy.log(`Generated Email: ${userEmail}`);

      cy.createMailGwAccount(userEmail).then((response) => {
        if (response.status === 201) {
          cy.log('Mail.gw account created successfully');
        } else if (response.status === 422) {
          cy.log('Account may already exist, attempting to continue');
        } else {
          expect(response.status).to.be.oneOf([201, 422]);
        }

        cy.generateRandomFCMToken().then((fcmToken) => {
          cy.log(`Generated FCM Token: ${fcmToken}`);

          cy.sendOTP({
            email: userEmail,
            device_id: testData.device_id,
            fcm_token: fcmToken,
            platform,
          }).then((response) => {
            expect(response.status).to.eq(200);

            // Wait for the email to arrive
            cy.wait(15000); // Increased wait time for email to arrive

            // Get OTP from mail.gw
            cy.getLatestOTPFromMailGw(userEmail).then(() => {
              cy.get('@otpCode').then((otp) => {
                cy.log(`OTP: ${otp}`);

                cy.verifyOTP({
                  email: userEmail,
                  otp,
                  device_id: testData.device_id,
                  fcm_token: fcmToken,
                  platform,
                }).then((response) => {
                  expect(response.body).to.have.property('code').to.equal(200);

                  const signupData = {
                    email: userEmail,
                    fcm_token: fcmToken,
                    ...testData,
                  };

                  cy.signUp(signupData).then((response) => {
                    const text = new TextDecoder().decode(response.body);
                    try {
                      const jsonResponse = JSON.parse(text);
                      console.log('Response Body (Parsed JSON):', jsonResponse);

                      expect(jsonResponse).to.have.property('code', 400);
                      expect(jsonResponse).to.have.property('data').to.be.null;
                      expect(jsonResponse).to.have.property('error', true);
                      expect(jsonResponse).to.have.property(
                        'message',
                        'Failed to upload photo'
                      );
                      expect(jsonResponse).to.have.property(
                        'name',
                        'BadRequestError'
                      );
                      expect(jsonResponse).to.have.property('status', 0);
                    } catch (error) {
                      console.log('Response Body (Raw Text):', text);
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  //case 5
  it('Sign Up with blank files meta', () => {
    const testData = {
      username: 'dummyTest',
      files: 'test1.jpeg',
      files_meta: '',
      dob: '2001-04-11',
      is_show_gender: '0',
      selfie_filename:
        'selfie/052019512329ac39e7f53999bd7956831724147883682.png',
      gender: '1',
      device_id: 'postman_localhost',
      join_location: 'jakarta',
    };

    const platform = 'ios';

    cy.generateRandomMailGwEmail().then((email) => {
      const userEmail = email;
      registeredEmail = userEmail;
      cy.log(`Generated Email: ${userEmail}`);

      cy.createMailGwAccount(userEmail).then((response) => {
        if (response.status === 201) {
          cy.log('Mail.gw account created successfully');
        } else if (response.status === 422) {
          cy.log('Account may already exist, attempting to continue');
        } else {
          expect(response.status).to.be.oneOf([201, 422]);
        }

        cy.generateRandomFCMToken().then((fcmToken) => {
          cy.log(`Generated FCM Token: ${fcmToken}`);

          cy.sendOTP({
            email: userEmail,
            device_id: testData.device_id,
            fcm_token: fcmToken,
            platform,
          }).then((response) => {
            expect(response.status).to.eq(200);

            // Wait for the email to arrive
            cy.wait(15000); // Increased wait time for email to arrive

            // Get OTP from mail.gw
            cy.getLatestOTPFromMailGw(userEmail).then(() => {
              cy.get('@otpCode').then((otp) => {
                cy.log(`OTP: ${otp}`);

                cy.verifyOTP({
                  email: userEmail,
                  otp,
                  device_id: testData.device_id,
                  fcm_token: fcmToken,
                  platform,
                }).then((response) => {
                  expect(response.body).to.have.property('code').to.equal(200);

                  const signupData = {
                    email: userEmail,
                    fcm_token: fcmToken,
                    ...testData,
                  };

                  cy.signUp(signupData).then((response) => {
                    const text = new TextDecoder().decode(response.body);
                    try {
                      const jsonResponse = JSON.parse(text);
                      console.log('Response Body (Parsed JSON):', jsonResponse);

                      expect(jsonResponse).to.have.property('code', 400);
                      expect(jsonResponse).to.have.property('data').to.be.null;
                      expect(jsonResponse).to.have.property('error', true);
                      expect(jsonResponse).to.have.property(
                        'message',
                        'Files metadata required'
                      );
                      expect(jsonResponse).to.have.property(
                        'name',
                        'BadRequestError'
                      );
                      expect(jsonResponse).to.have.property('status', 0);
                    } catch (error) {
                      console.log('Response Body (Raw Text):', text);
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  //case 6
  it('Sign Up with not valid dob', () => {
    const testData = {
      username: 'dummyTest',
      files: 'test1.jpeg',
      files_meta: '[{"filename":"test1.jpeg","order":0}]',
      dob: 'abc',
      is_show_gender: '0',
      selfie_filename:
        'selfie/052019512329ac39e7f53999bd7956831724147883682.png',
      gender: '1',
      device_id: 'postman_localhost',
      join_location: 'jakarta',
    };

    const platform = 'ios';

    cy.generateRandomMailGwEmail().then((email) => {
      const userEmail = email;
      registeredEmail = userEmail;
      cy.log(`Generated Email: ${userEmail}`);

      cy.createMailGwAccount(userEmail).then((response) => {
        if (response.status === 201) {
          cy.log('Mail.gw account created successfully');
        } else if (response.status === 422) {
          cy.log('Account may already exist, attempting to continue');
        } else {
          expect(response.status).to.be.oneOf([201, 422]);
        }

        cy.generateRandomFCMToken().then((fcmToken) => {
          cy.log(`Generated FCM Token: ${fcmToken}`);

          cy.sendOTP({
            email: userEmail,
            device_id: testData.device_id,
            fcm_token: fcmToken,
            platform,
          }).then((response) => {
            expect(response.status).to.eq(200);

            // Wait for the email to arrive
            cy.wait(15000); // Increased wait time for email to arrive

            // Get OTP from mail.gw
            cy.getLatestOTPFromMailGw(userEmail).then(() => {
              cy.get('@otpCode').then((otp) => {
                cy.log(`OTP: ${otp}`);

                cy.verifyOTP({
                  email: userEmail,
                  otp,
                  device_id: testData.device_id,
                  fcm_token: fcmToken,
                  platform,
                }).then((response) => {
                  expect(response.body).to.have.property('code').to.equal(200);

                  const signupData = {
                    email: userEmail,
                    fcm_token: fcmToken,
                    ...testData,
                  };

                  cy.signUp(signupData).then((response) => {
                    const text = new TextDecoder().decode(response.body);
                    try {
                      const jsonResponse = JSON.parse(text);
                      console.log('Response Body (Parsed JSON):', jsonResponse);

                      expect(jsonResponse).to.have.property('code', 400);
                      expect(jsonResponse).to.have.property('data').to.be.null;
                      expect(jsonResponse).to.have.property('error', true);
                      expect(jsonResponse).to.have.property(
                        'message',
                        'DOB format not valid'
                      );
                      expect(jsonResponse).to.have.property(
                        'name',
                        'BadRequestError'
                      );
                    } catch (error) {
                      console.log('Response Body (Raw Text):', text);
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  //case 7
  it('Sign Up with blank selfie file name', () => {
    const testData = {
      username: 'dummyTest',
      files: 'test1.jpeg',
      files_meta: '[{"filename":"test1.jpeg","order":0}]',
      dob: '2001-04-11',
      is_show_gender: '0',
      selfie_filename: '',
      gender: '1',
      device_id: 'postman_localhost',
      join_location: 'jakarta',
    };

    const platform = 'ios';

    cy.generateRandomMailGwEmail().then((email) => {
      const userEmail = email;
      registeredEmail = userEmail;
      cy.log(`Generated Email: ${userEmail}`);

      cy.createMailGwAccount(userEmail).then((response) => {
        if (response.status === 201) {
          cy.log('Mail.gw account created successfully');
        } else if (response.status === 422) {
          cy.log('Account may already exist, attempting to continue');
        } else {
          expect(response.status).to.be.oneOf([201, 422]);
        }

        cy.generateRandomFCMToken().then((fcmToken) => {
          cy.log(`Generated FCM Token: ${fcmToken}`);

          cy.sendOTP({
            email: userEmail,
            device_id: testData.device_id,
            fcm_token: fcmToken,
            platform,
          }).then((response) => {
            expect(response.status).to.eq(200);

            // Wait for the email to arrive
            cy.wait(15000); // Increased wait time for email to arrive

            // Get OTP from mail.gw
            cy.getLatestOTPFromMailGw(userEmail).then(() => {
              cy.get('@otpCode').then((otp) => {
                cy.log(`OTP: ${otp}`);

                cy.verifyOTP({
                  email: userEmail,
                  otp,
                  device_id: testData.device_id,
                  fcm_token: fcmToken,
                  platform,
                }).then((response) => {
                  expect(response.body).to.have.property('code').to.equal(200);

                  const signupData = {
                    email: userEmail,
                    fcm_token: fcmToken,
                    ...testData,
                  };

                  cy.signUp(signupData).then((response) => {
                    const text = new TextDecoder().decode(response.body);
                    try {
                      const jsonResponse = JSON.parse(text);
                      console.log('Response Body (Parsed JSON):', jsonResponse);

                      expect(jsonResponse).to.have.property('code', 400);
                      expect(jsonResponse).to.have.property('data').to.be.null;
                      expect(jsonResponse).to.have.property('error', true);
                      expect(jsonResponse).to.have.property(
                        'message',
                        'Selfie filename required'
                      );
                      expect(jsonResponse).to.have.property(
                        'name',
                        'BadRequestError'
                      );
                    } catch (error) {
                      console.log('Response Body (Raw Text):', text);
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  // //case 8
  it('Sign Up with selfie file name not exist', () => {
    const testData = {
      username: 'dummyTest',
      files: 'test1.jpeg',
      files_meta: '[{"filename":"test1.jpeg","order":0}]',
      dob: '2001-04-11',
      is_show_gender: '0',
      selfie_filename:
        'selfie/00d405fcc28174cd87165e11346487a91719914768140.png',
      gender: '1',
      device_id: 'postman_localhost',
      join_location: 'jakarta',
    };

    const platform = 'ios';

    cy.generateRandomMailGwEmail().then((email) => {
      const userEmail = email;
      registeredEmail = userEmail;
      cy.log(`Generated Email: ${userEmail}`);

      cy.createMailGwAccount(userEmail).then((response) => {
        if (response.status === 201) {
          cy.log('Mail.gw account created successfully');
        } else if (response.status === 422) {
          cy.log('Account may already exist, attempting to continue');
        } else {
          expect(response.status).to.be.oneOf([201, 422]);
        }

        cy.generateRandomFCMToken().then((fcmToken) => {
          cy.log(`Generated FCM Token: ${fcmToken}`);

          cy.sendOTP({
            email: userEmail,
            device_id: testData.device_id,
            fcm_token: fcmToken,
            platform,
          }).then((response) => {
            expect(response.status).to.eq(200);

            // Wait for the email to arrive
            cy.wait(15000); // Increased wait time for email to arrive

            // Get OTP from mail.gw
            cy.getLatestOTPFromMailGw(userEmail).then(() => {
              cy.get('@otpCode').then((otp) => {
                cy.log(`OTP: ${otp}`);

                cy.verifyOTP({
                  email: userEmail,
                  otp,
                  device_id: testData.device_id,
                  fcm_token: fcmToken,
                  platform,
                }).then((response) => {
                  expect(response.body).to.have.property('code').to.equal(200);

                  const signupData = {
                    email: userEmail,
                    fcm_token: fcmToken,
                    ...testData,
                  };

                  cy.signUp(signupData).then((response) => {
                    const text = new TextDecoder().decode(response.body);
                    try {
                      const jsonResponse = JSON.parse(text);
                      console.log('Response Body (Parsed JSON):', jsonResponse);

                      expect(jsonResponse).to.have.property('code', 400);
                      expect(jsonResponse).to.have.property('data').to.be.null;
                      expect(jsonResponse).to.have.property('error', true);
                      expect(jsonResponse).to.have.property(
                        'message',
                        'Selfie image file not exists'
                      );
                      expect(jsonResponse).to.have.property(
                        'name',
                        'BadRequestError'
                      );
                    } catch (error) {
                      console.log('Response Body (Raw Text):', text);
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  // //case 9
  it('Sign Up with not valid gender', () => {
    const testData = {
      username: 'dummyTest',
      files: 'test1.jpeg',
      files_meta: '[{"filename":"test1.jpeg","order":0}]',
      dob: '2001-04-11',
      is_show_gender: '0',
      selfie_filename:
        'selfie/052019512329ac39e7f53999bd7956831724147883682.png',
      gender: '',
      device_id: 'postman_localhost',
      join_location: 'jakarta',
    };

    const platform = 'ios';

    cy.generateRandomMailGwEmail().then((email) => {
      const userEmail = email;
      registeredEmail = userEmail;
      cy.log(`Generated Email: ${userEmail}`);

      cy.createMailGwAccount(userEmail).then((response) => {
        if (response.status === 201) {
          cy.log('Mail.gw account created successfully');
        } else if (response.status === 422) {
          cy.log('Account may already exist, attempting to continue');
        } else {
          expect(response.status).to.be.oneOf([201, 422]);
        }

        cy.generateRandomFCMToken().then((fcmToken) => {
          cy.log(`Generated FCM Token: ${fcmToken}`);

          cy.sendOTP({
            email: userEmail,
            device_id: testData.device_id,
            fcm_token: fcmToken,
            platform,
          }).then((response) => {
            expect(response.status).to.eq(200);

            // Wait for the email to arrive
            cy.wait(15000); // Increased wait time for email to arrive

            // Get OTP from mail.gw
            cy.getLatestOTPFromMailGw(userEmail).then(() => {
              cy.get('@otpCode').then((otp) => {
                cy.log(`OTP: ${otp}`);

                cy.verifyOTP({
                  email: userEmail,
                  otp,
                  device_id: testData.device_id,
                  fcm_token: fcmToken,
                  platform,
                }).then((response) => {
                  expect(response.body).to.have.property('code').to.equal(200);

                  const signupData = {
                    email: userEmail,
                    fcm_token: fcmToken,
                    ...testData,
                  };

                  cy.signUp(signupData).then((response) => {
                    const text = new TextDecoder().decode(response.body);
                    try {
                      const jsonResponse = JSON.parse(text);
                      console.log('Response Body (Parsed JSON):', jsonResponse);

                      expect(jsonResponse).to.have.property('code', 400);
                      expect(jsonResponse).to.have.property('data').to.be.null;
                      expect(jsonResponse).to.have.property('error', true);
                      expect(jsonResponse).to.have.property(
                        'message',
                        'gender: must be integer'
                      );
                      expect(jsonResponse).to.have.property(
                        'name',
                        'ValidationError'
                      );
                    } catch (error) {
                      console.log('Response Body (Raw Text):', text);
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
