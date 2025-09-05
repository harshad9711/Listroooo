describe('UGC Flow E2E', () => {
  it('should ingest, request rights, classify, and approve UGC', () => {
    // 1. Ingest UGC
    cy.request('POST', '/api/ugc/ingest', { hashtag: 'testugc' }).then((ingest) => {
      expect(ingest.status).to.eq(200);
      const contentId = ingest.body.contentId || ingest.body.id;
      expect(contentId).to.exist;

      // 2. Request rights
      cy.request('POST', '/api/ugc/request-rights', { contentId, userEmail: 'test@example.com' }).then((rights) => {
        expect(rights.status).to.eq(200);
        expect(rights.body.status || rights.body.sent).to.exist;

        // 3. Classify UGC
        cy.request('POST', '/api/ugc/classify', { contentId, contentUrl: 'https://example.com/testugc.jpg' }).then((classify) => {
          expect(classify.status).to.eq(200);
          expect(classify.body.result || classify.body.classification).to.exist;

          // 4. Approve high-quality
          cy.request('POST', '/api/ugc/approve', { contentId }).then((approve) => {
            expect(approve.status).to.eq(200);
            expect(approve.body.approved).to.be.true;
          });
        });
      });
    });
  });
}); 