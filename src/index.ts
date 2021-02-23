// Just re-exporting everything.
export {
  SectionCode,
  OperatorCode,
  OperatorCodeNames,
  ExternalKind,
  Type,
  RelocType,
  LinkingType,
  NameType,
  BinaryReaderState,
  Int64,
  BinaryReader,
  bytesToString,
  IModuleHeader,
  IResizableLimits,
  ITableType,
  IMemoryType,
  IGlobalType,
  IGlobalVariable,
  IElementSegment,
  IElementSegmentBody,
  IDataSegment,
  IDataSegmentBody,
  ImportEntryType,
  IImportEntry,
  IExportEntry,
  INameEntry,
  INaming,
  IModuleNameEntry,
  IFunctionNameEntry,
  ILocalName,
  ILocalNameEntry,
  ILinkingEntry,
  IRelocHeader,
  IRelocEntry,
  ISourceMappingURL,
  IStartEntry,
  IFunctionEntry,
  ITypeEntry,
  ISectionInformation,
  ILocals,
  IFunctionInformation,
  IMemoryAddress,
  IOperatorInformation,
  IBinaryReaderData,
} from "./WasmParser.js";
export {
  DefaultNameResolver,
  NumericNameResolver,
  WasmDisassembler,
  LabelMode,
  IDisassemblerResult,
  INameResolver,
} from "./WasmDis.js";
