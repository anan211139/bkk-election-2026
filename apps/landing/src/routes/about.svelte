<script lang="ts">
	import Metadata from '../components/metadata.svelte';
	import ExternalLink from '../components/external-link.svelte';
	import PartnersLogo from '../components/partners-logo.svelte';
</script>

<Metadata title="เกี่ยวกับเว็บไซต์นี้ - Bangkok Election 2022" />

<div class="max-w-screen-md mx-auto px-4 py-12 md:py-24 space-y-16 md:space-y-20 typo-b4">
	<div class="flex flex-col items-center space-y-4">
		<img
			src="/static/images/bkkelection-black-big.svg"
			class="w-full max-w-md"
			alt="Bangkok Election 2022"
		/>
		<p class="typo-h6 text-center">ข้อมูลเกี่ยวกับการเลือกตั้งผู้ว่าฯ และสมาชิกสภา กทม. ปี 2569</p>
	</div>

	<div class="paragraph">
		<h2 class="typo-h3">เกี่ยวกับโปรเจกต์</h2>
		<p>
			เว็บไซต์รายงานผลการเลือกตั้งผู้ว่าราชการกรุงเทพมหานคร และสมาชิกสภากรุงเทพมหานคร (ส.ก.) <br/>
			วันที่ 28 มิถุนายน 2569 จัดทำโดย <b>กรุงเทพมหานคร</b> เพื่ออำนวยความสะดวกให้ประชาชน<br/>เข้าถึงข้อมูลผู้สมัครและติดตามผลคะแนนอย่างไม่เป็นทางการได้อย่างรวดเร็ว
		</p>
	</div>

	<div class="paragraph">
		<h2 class="typo-h3">การพัฒนาต่อยอดและลิขสิทธิ์</h2>
		<p>
			ระบบนี้พัฒนาต่อยอดจากโครงสร้าง Open Source ของโปรเจกต์ <ExternalLink href="https://bkkelection2022.wevis.info/">Bangkok Election 2022</ExternalLink> <br/>โดยความร่วมมือของ WeVis, THE STANDARD และ Wisesight
			เพื่อให้เป็นไปตามเงื่อนไขลิขสิทธิ์ต้นฉบับ
		</p>
		<p>
			กรุงเทพมหานครเผยแพร่เว็บไซต์นี้ภายใต้สัญญาอนุญาต Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0) โดยมีหลักเกณฑ์ดังนี้:
		</p>
		<ul class="list-inside list-disc">
			<li>ระบุที่มา: อ้างอิงถึงคณะผู้พัฒนาต้นฉบับ (WeVis x THE STANDARD x Wisesight)</li>
			<li>ไม่ใช้เพื่อการค้า: ดำเนินการเพื่อประโยชน์สาธารณะโดยหน่วยงานรัฐ</li>
			<li>ใช้สัญญาอนุญาตเดียวกัน: หากนำข้อมูลหรือซอร์สโค้ดไปพัฒนาต่อ ต้องเผยแพร่ภายใต้เงื่อนไข CC BY-NC-SA เช่นเดิม</li>
		</ul>
		<div class="mt-4 flex justify-center">
			<ExternalLink href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
				<img
				src="https://mirrors.creativecommons.org/presskit/buttons/88x31/svg/by-nc-sa.svg"
				alt="Creative Commons License"
				class="h-16"
				/>
			</ExternalLink>
		</div>
	</div>
	<div class="paragraph">
		<h2 class="typo-h3">ที่มาของข้อมูล</h2>
		<ul class="list-inside list-disc">
			<li>
				<ExternalLink href="https://www.ect.go.th/bangkok/"
					>สำนักงานคณะกรรมการการเลือกตั้งประจำกรุงเทพมหานคร</ExternalLink
				>
			</li>
			<li>
				<ExternalLink href="https://webportal.bangkok.go.th/psbma"
					>สำนักปลัดกรุงเทพมหานคร</ExternalLink
				>
			</li>
			<li>
				<ExternalLink href="https://www.prbangkok.com/"
					>สำนักงานประชาสัมพันธ์ กรุงเทพมหานคร</ExternalLink
				>
			</li>
			<li class="list-none">
				<div class="mt-6">
					โครงสร้างระบบ: พัฒนาจากต้นฉบับโดย
					<div class="mt-4">
						<PartnersLogo black />
					</div>
				</div>
			</li>
		</ul>
	</div>
</div>

<style>
	.paragraph {
		@apply space-y-8;
	}
</style>
