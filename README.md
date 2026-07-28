# Random Cleaning Duty

회사 청소 당번을 공정하고 균등하게 자동 배정하는 웹 앱입니다.

**기술:** HTML · CSS · Vanilla JavaScript (LocalStorage)  
**외부 라이브러리:** SheetJS(XLSX), FileSaver.js  
**로그인:** 자체 로그인 없음 — 기존 사이트 세션에 연동 가능

## 시작하기

1. `index.html`(일정) 또는 `admin.html`(관리)을 엽니다. (Live Server 권장)
2. 일정 페이지에서 **본인**을 선택하면 내 일정·교환 요청을 사용할 수 있습니다.
3. 관리자 페이지에서 직원·일정·교환을 관리합니다.

## 프로젝트 구조

```
index.html          # 일정 / 내 일정 / 교환
admin.html          # 관리자
/css
  style.css
  admin.css
/js
  app.js
  schedule.js
  employee.js
  excel.js
  swap.js
  login.js          # 인증 연동 어댑터 + Toast/테마/언어
  storage.js
  animation.js
/data
  employees.json
/img
  logo.svg
```

## 기존 사이트 로그인 연동

자체 아이디/비밀번호 로그인은 제거했습니다.  
나중에 로그인이 있는 사이트에 넣을 때 아래처럼 사용자만 넘겨 주세요.

### 1) 전역 객체 (권장)

```html
<script>
  window.RCD_AUTH = {
    role: 'user',          // 'user' | 'admin'
    name: '김민수',        // 직원 이름 (명단과 일치)
    employeeId: 'emp-001'  // 선택
  };
</script>
<script src=".../js/app.js"></script>
```

### 2) 함수 호출

```js
setExternalUser({ role: 'user', name: '김민수' });
// 관리자
setExternalUser({ role: 'admin', name: '관리자' });
```

### 3) URL 파라미터 (iframe)

```
index.html?name=김민수&role=user
admin.html?role=admin
```

- **접근 제어**(누가 admin 페이지를 볼 수 있는지)는 부모 사이트에서 처리하면 됩니다.
- 외부 사용자가 주입되면 일정 페이지의 **본인 선택** 드롭다운은 자동으로 숨겨집니다.

## 운영 규칙

- 하루에 **2명** (주방담당 / 화장실 담당)
- **일요일·공휴일** 배정 제외
- 담당 횟수 **균등** 배분
- 사람마다 **주방담당 ↔ 화장실 담당** 번갈아 담당
- 격월 **1회 → 2회 → 1회 → 2회** 자동 적용
- 같은 사람 **연속 배정** 최대한 방지

## 당번 역할

| 담당 | 업무 |
|------|------|
| 주방담당 | 음식물 쓰레기통 청소, 정수기 주변 닦기 |
| 화장실 담당 | 변기 시트 클리너 확인·보충, 휴지 확인·보충 |

## 주요 기능

| 기능 | 설명 |
|------|------|
| 직원 관리 | 추가·수정·삭제·검색, 엑셀 업로드(드래그앤드롭) |
| 자동 배정 | 월간 일정 생성 + 슬롯머신 추첨 애니메이션 |
| 일정 보기 | 주간 / 월간 / 내 일정 토글 |
| 명단 수정 | 관리자 즉시 LocalStorage 저장 |
| 교환 요청 | Pending / Approved / Rejected / Expired + 규칙 검사 |
| 언어 | 한국어 ↔ 중국어 |
| 기타 | 다크모드, Toast, Loading, Empty, 반응형 |
| 다운로드 | 당번표·역할 시트 xlsx |

## 엑셀 업로드 형식

| 이름 | 부서 |
|------|------|
| 홍길동 | 경영지원 |

## 참고

- 초기 직원 예시: `data/employees.json`
- 데이터는 LocalStorage에 저장되어 새로고침 후에도 유지됩니다.
