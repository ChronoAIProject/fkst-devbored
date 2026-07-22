import 'dart:convert';
import 'dart:io';

import 'package:devbored_contracts/devbored_contracts.dart';
import 'package:test/test.dart';

final Uri _fixtureRoot = Directory.current.parent.uri.resolve(
  '../packages/packages/devbored/tests/fixtures/',
);

String _fixture(String relativePath) =>
    File.fromUri(_fixtureRoot.resolve(relativePath)).readAsStringSync();

void main() {
  group('canonical marker corpus', () {
    const markerFixtures = [
      'markers/state.txt',
      'markers/consensus.txt',
      'markers/review.txt',
      'markers/merge-ready.txt',
      'markers/failure.txt',
    ];

    for (final relativePath in markerFixtures) {
      test('$relativePath parses and rebuilds byte-for-byte', () {
        final fixtureBytes = File.fromUri(
          _fixtureRoot.resolve(relativePath),
        ).readAsBytesSync();
        final source = utf8.decode(fixtureBytes);
        final parsed = parseMarker(source);

        expect(parsed, isA<DevboredMarker>());
        final rebuilt = (parsed as DevboredMarker).build();
        expect(utf8.encode(rebuilt), orderedEquals(fixtureBytes));
      });
    }

    const emittedSliceMarkers = [
      'slice/state-marker.txt',
      'slice/consensus-marker.txt',
    ];

    for (final relativePath in emittedSliceMarkers) {
      test('$relativePath is the canonical marker plus one record LF', () {
        final fixtureBytes = File.fromUri(
          _fixtureRoot.resolve(relativePath),
        ).readAsBytesSync();
        final source = utf8.decode(fixtureBytes);
        final parsed = parseMarker(source);

        expect(parsed, isA<DevboredMarker>());
        final emittedRecord = '${(parsed as DevboredMarker).build()}\n';
        expect(utf8.encode(emittedRecord), orderedEquals(fixtureBytes));
      });
    }

    test('unknown, malformed, and ambiguous markers fail closed', () {
      const headSha = '3333333333333333333333333333333333333333';
      final cases = [
        'ordinary comment',
        '<!-- fkst:devbored:state:v1 work_item="item"',
        '<!-- fkst:devbored:state:v2 work_item="item" state="ready" '
            'version="1" stage_rank="500" -->',
        '<!-- fkst:devbored:state:v1 work_item="item" state="ready" '
            'version="01" stage_rank="500" -->',
        '<!-- fkst:devbored:merge-ready:v1 pr="84" head_sha="$headSha" '
            'version="7" -->\n'
            '<!-- fkst:devbored:merge-ready:v1 pr="84" head_sha="$headSha" '
            'version="8" -->',
      ];

      for (final source in cases) {
        final parsed = parseMarker(source);
        expect(parsed, isA<UnparseableMarker>(), reason: source);
        expect((parsed as UnparseableMarker).reason, isNotEmpty);
      }
    });

    test('builders encode safe strings canonically', () {
      final marker = FailureMarker(
        workItem: 'item&42',
        errorClass: 'external-issue',
        fingerprint: 'github/comment/42',
        why: 'received <invalid> "payload" & stopped',
      );
      final rebuilt = marker.build();
      expect(rebuilt, contains('&amp;'));
      expect(rebuilt, contains('&lt;'));
      expect(rebuilt, contains('&quot;'));
      expect(parseMarker(rebuilt), marker);
    });
  });

  group('devbored.config.v1 corpus', () {
    test('valid.json loads as an immutable typed contract', () {
      final config = DevboredConfig.parse(_fixture('valid.json'));

      expect(config.schema, 'devbored.config.v1');
      expect(config.version, 2);
      expect(config.stages.design.seats, [
        'teleology',
        'parsimony',
        'fidelity',
      ]);
      expect(config.stages.review.seats, [
        'correctness',
        'test-adequacy',
        'scope',
        'security',
      ]);
      expect(config.stages.merge.targetBranch, 'dev');
      expect(
        () => config.stages.design.seats.add('mutate'),
        throwsUnsupportedError,
      );
      expect(
        () => config.labels.state['new'] = 'devbored:new',
        throwsUnsupportedError,
      );
    });

    const invalidFixtures = {
      'invalid-json.json': 'devbored config error: invalid JSON',
      'invalid-version.json':
          'devbored config error: version must be a positive integer',
      'invalid-design-seats.json':
          'devbored config error: stages.design.seats must contain 1 to 4 '
              'distinct marker-safe names',
      'invalid-review-seats.json':
          'devbored config error: stages.review.seats must contain 1 to 4 '
              'distinct marker-safe names',
      'wrong-schema.json':
          'devbored config error: expected schema devbored.config.v1',
    };

    for (final entry in invalidFixtures.entries) {
      test('${entry.key} fails closed with its specific error', () {
        expect(
          () => DevboredConfig.parse(_fixture(entry.key)),
          throwsA(
            isA<ConfigException>().having(
              (error) => error.message,
              'message',
              entry.value,
            ),
          ),
        );
      });
    }

    test('stale-version.json enforces the backward-version rule', () {
      expect(
        () => DevboredConfig.parse(
          _fixture('stale-version.json'),
          previousVersion: 2,
        ),
        throwsA(
          isA<ConfigException>().having(
            (error) => error.message,
            'message',
            'devbored config error: version moved backward',
          ),
        ),
      );
    });

    test('unknown config fields are rejected', () {
      final json = jsonDecode(_fixture('valid.json')) as Map<String, dynamic>;
      json['future'] = true;

      expect(
        () => DevboredConfig.fromJson(json),
        throwsA(
          isA<ConfigException>().having(
            (error) => error.message,
            'message',
            r'devbored config error: unknown field $.future',
          ),
        ),
      );
    });
  });

  group('vertical-slice observed payloads', () {
    const expectedSeats = ['teleology', 'parsimony', 'security', 'ops-cost'];

    test('proposal parses to typed values and preserves seat order', () {
      final proposal = ConsensusProposal.parse(_fixture('slice/proposal.json'));

      expect(proposal.schema, 'consensus.proposal.v1');
      expect(proposal.effectVersion, 7);
      expect(proposal.stage, 'design');
      expect(proposal.seats, expectedSeats);
      expect(
        proposal.sourceRef,
        SourceRef(kind: 'external', ref: 'owner/repo#issue/42'),
      );
    });

    test(
      'consensus result parses to typed values and preserves seat order',
      () {
        final result = ConsensusResult.parse(
          _fixture('slice/consensus-result.json'),
        );

        expect(result.schema, 'consensus.consensus_reached.v1');
        expect(result.effectVersion, 7);
        expect(result.decision, 'approve');
        expect(result.seats, expectedSeats);
        expect(
          result.angleResults.every((item) => item.verdict == 'approve'),
          isTrue,
        );
      },
    );

    test('observed payloads ignore unknown fields', () {
      final proposalJson =
          jsonDecode(_fixture('slice/proposal.json')) as Map<String, dynamic>;
      proposalJson['upstream_addition'] = {'safe': true};

      final proposal = ConsensusProposal.fromJson(proposalJson);
      expect(proposal.seats, expectedSeats);
    });
  });
}
