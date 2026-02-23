export function mockContributionResponse(rinkId = 'canton-ice-house-canton') {
  return {
    data: {
      summary: {
        rink_id: rinkId,
        verdict: 'Good rink overall',
        signals: [
          { signal: 'parking', value: 4.2, count: 6, confidence: 0.8 },
        ],
        tips: [],
        evidence_counts: {},
        contribution_count: 6,
      },
    },
  };
}
