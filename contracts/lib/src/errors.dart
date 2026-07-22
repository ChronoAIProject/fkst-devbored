final class ContractFormatException implements FormatException {
  const ContractFormatException(this.message, {this.source, this.offset});

  @override
  final String message;

  @override
  final Object? source;

  @override
  final int? offset;

  @override
  String toString() => message;
}

final class ConfigException implements FormatException {
  const ConfigException._(this.detail, {this.source});

  factory ConfigException(String detail, {Object? source}) =>
      ConfigException._(detail, source: source);

  final String detail;

  @override
  String get message => 'devbored config error: $detail';

  @override
  final Object? source;

  @override
  int? get offset => null;

  @override
  String toString() => message;
}

final class MarkerBuildException implements FormatException {
  const MarkerBuildException(this.detail);

  final String detail;

  @override
  String get message => 'devbored: marker-invalid: $detail';

  @override
  Object? get source => null;

  @override
  int? get offset => null;

  @override
  String toString() => message;
}
