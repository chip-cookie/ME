import enum


class DocType(str, enum.Enum):
    SELF_INTRODUCTION = "자기소개서"
    CAREER_DESCRIPTION = "경력기술서"
    APPLICATION = "지원서"


class OrgType(str, enum.Enum):
    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"


class ResultLabel(str, enum.Enum):
    PASS = "PASS"
    FAIL = "FAIL"


class GleaningStatus(str, enum.Enum):
    RUNNING = "RUNNING"
    PASSED = "PASSED"
    MAX_ITER = "MAX_ITER"


class DatasetType(str, enum.Enum):
    SFT = "SFT"
    DPO = "DPO"
